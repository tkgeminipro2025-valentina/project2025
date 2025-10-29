import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase service credentials for ai-telemetry function.");
}

const createAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service credentials are not configured.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } },
  });
};

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extractBearer = (headerValue: string | null) => {
  if (!headerValue) return null;
  const [, token] = headerValue.split(" ");
  return token ?? null;
};

serve(async (req) => {
  console.log("ai-telemetry function called");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const authHeader = req.headers.get("Authorization");
    const accessToken = extractBearer(authHeader);

    if (!accessToken) {
      return jsonResponse(401, { error: "Missing access token" });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Failed to resolve user from token", userError);
      return jsonResponse(401, { error: "Unable to authenticate request" });
    }

    const body = await req.json();
    const action = body?.action;

    if (typeof action !== "string") {
      return jsonResponse(400, { error: "Missing action" });
    }

    const ensureSessionOwner = async (sessionId: string) => {
      const { data, error } = await supabase
        .from("ai_sessions")
        .select("id, created_by, metadata")
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        return jsonResponse(404, { error: "Session not found" });
      }

      if (data.created_by !== user.id) {
        return jsonResponse(403, { error: "Forbidden" });
      }

      return data;
    };

    switch (action) {
      case "start_session": {
        const channel = body?.channel ?? "assistant";
        const metadata =
          typeof body?.metadata === "object" && body.metadata !== null ? body.metadata : {};

        const { data, error } = await supabase
          .from("ai_sessions")
          .insert({
            channel,
            metadata,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (error || !data) {
          console.error("Failed to create session", error);
          return jsonResponse(500, { error: "Failed to create session" });
        }

        return jsonResponse(200, { sessionId: data.id });
      }

      case "log_message": {
        const sessionId: string | undefined = body?.sessionId;
        const role: string | undefined = body?.role;
        const content: string | undefined = body?.content;
        const tokens: number | null = typeof body?.tokens === "number" ? body.tokens : null;

        if (!sessionId || !role || !content) {
          return jsonResponse(400, { error: "Missing sessionId, role or content" });
        }
        if (!["user", "assistant", "system"].includes(role)) {
          return jsonResponse(400, { error: "Invalid role" });
        }

        const sessionCheck = await ensureSessionOwner(sessionId);
        if (sessionCheck instanceof Response) {
          return sessionCheck;
        }

        const { data, error } = await supabase
          .from("ai_messages")
          .insert({
            session_id: sessionId,
            role,
            content,
            tokens,
          })
          .select("id")
          .single();

        if (error || !data) {
          console.error("Failed to log message", error);
          return jsonResponse(500, { error: "Failed to log message" });
        }

        await supabase
          .from("ai_sessions")
          .update({ last_interaction_at: new Date().toISOString() })
          .eq("id", sessionId);

        return jsonResponse(200, { messageId: data.id });
      }

      case "submit_feedback": {
        const sessionId: string | undefined = body?.sessionId;
        const messageId: string | null =
          typeof body?.messageId === "string" ? body.messageId : null;
        const rating: number | undefined = body?.rating;
        const comment: string | null =
          typeof body?.comment === "string" && body.comment.trim().length > 0
            ? body.comment
            : null;

        if (!sessionId || typeof rating !== "number") {
          return jsonResponse(400, { error: "Missing sessionId or rating" });
        }

        if (![ -1, 0, 1 ].includes(rating)) {
          return jsonResponse(400, { error: "Invalid rating" });
        }

        const sessionCheck = await ensureSessionOwner(sessionId);
        if (sessionCheck instanceof Response) {
          return sessionCheck;
        }

        const payload: Record<string, unknown> = {
          session_id: sessionId,
          rating,
          comment,
          created_by: user.id,
        };

        if (messageId) {
          payload.message_id = messageId;
        }

        const upsertOptions = messageId ? { onConflict: "session_id,message_id" } : undefined;
        const { error } = await supabase.from("ai_feedback").upsert(payload, upsertOptions);

        if (error) {
          console.error("Failed to submit feedback", error);
          return jsonResponse(500, { error: "Failed to submit feedback" });
        }

        return jsonResponse(200, { success: true });
      }

      case "touch_session": {
        const sessionId: string | undefined = body?.sessionId;

        if (!sessionId) {
          return jsonResponse(400, { error: "Missing sessionId" });
        }

        const sessionCheck = await ensureSessionOwner(sessionId);
        if (sessionCheck instanceof Response) {
          return sessionCheck;
        }

        const { error } = await supabase
          .from("ai_sessions")
          .update({ last_interaction_at: new Date().toISOString() })
          .eq("id", sessionId);

        if (error) {
          console.error("Failed to update session heartbeat", error);
          return jsonResponse(500, { error: "Failed to update session" });
        }

        return jsonResponse(200, { success: true });
      }

      case "list_sessions": {
        const limitValue = typeof body?.limit === "number" ? body.limit : 20;
        const limit = Math.min(Math.max(Math.floor(limitValue), 1), 50);

        const { data, error } = await supabase
          .from("ai_sessions")
          .select("id, created_at, last_interaction_at, metadata")
          .eq("created_by", user.id)
          .order("last_interaction_at", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Failed to list sessions", error);
          return jsonResponse(500, { error: "Failed to list sessions" });
        }

        const sessions = (data ?? []).map((session) => ({
          id: session.id,
          createdAt: session.created_at ?? null,
          lastInteractionAt: session.last_interaction_at ?? null,
          metadata: session.metadata ?? null,
        }));

        return jsonResponse(200, { sessions });
      }

      case "get_session_messages": {
        const sessionId: string | undefined = body?.sessionId;

        if (!sessionId) {
          return jsonResponse(400, { error: "Missing sessionId" });
        }

        const sessionCheck = await ensureSessionOwner(sessionId);
        if (sessionCheck instanceof Response) {
          return sessionCheck;
        }

        const { data, error } = await supabase
          .from("ai_messages")
          .select("id, session_id, role, content, tokens, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Failed to load session messages", error);
          return jsonResponse(500, { error: "Failed to load messages" });
        }

        const messages = (data ?? []).map((message) => ({
          id: message.id,
          sessionId: message.session_id,
          role: message.role,
          content: message.content,
          tokens: message.tokens ?? null,
          createdAt: message.created_at ?? new Date().toISOString(),
        }));

        return jsonResponse(200, { messages });
      }

      case "update_session": {
        const sessionId: string | undefined = body?.sessionId;
        const title: string | null =
          typeof body?.title === "string" && body.title.trim().length > 0
            ? body.title.trim()
            : null;

        if (!sessionId || !title) {
          return jsonResponse(400, { error: "Missing sessionId or title" });
        }

        const sessionCheck = await ensureSessionOwner(sessionId);
        if (sessionCheck instanceof Response) {
          return sessionCheck;
        }

        const nextMetadata = {
          ...(sessionCheck.metadata ?? {}),
          title,
        };

        const { data, error } = await supabase
          .from("ai_sessions")
          .update({ metadata: nextMetadata })
          .eq("id", sessionId)
          .select("metadata")
          .single();

        if (error || !data) {
          console.error("Failed to update session metadata", error);
          return jsonResponse(500, { error: "Failed to update session" });
        }

        return jsonResponse(200, { metadata: data.metadata ?? nextMetadata });
      }

      default:
        return jsonResponse(400, { error: `Unsupported action: ${action}` });
    }
  } catch (error) {
    console.error("ai-telemetry error", error);
    console.error("ai-telemetry error", error);
    return jsonResponse(500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});
