// supabase/functions/generate-embedding/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai';

// Add CORS headers to handle preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tableName, recordId, textToEmbed } = await req.json();

    if (!tableName || !recordId || !textToEmbed) {
      throw new Error("Missing required parameters: tableName, recordId, textToEmbed");
    }

    // 1. Get Gemini API Key from secrets
    // @ts-ignore
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in Supabase secrets.");
    }
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // 2. Generate the embedding
    // FIX: Corrected API call to use 'contents' (plural array) and expect 'embeddings' (plural array) in response.
    const startTime = Date.now();
    console.log(`Generating embedding for ${tableName}:${recordId} with text: ${textToEmbed.substring(0, 50)}...`); // Log the first 50 characters of the text
    const embeddingResponse = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: [textToEmbed]
    });
    const embedding = embeddingResponse.embeddings[0].values;
    const endTime = Date.now();
    console.log(`Embedding generated in ${endTime - startTime}ms. Embedding dimensions: ${embedding.length}`);

    if (!embedding) {
        throw new Error("Failed to generate embedding from Gemini API.");
    }

    // 3. Get Supabase credentials from secrets and create admin client
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
// @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase URL or Service Role Key is not set in secrets. Expect EDGE_SUPABASE_URL and EDGE_SUPABASE_SERVICE_ROLE_KEY.");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 4. Update the record in the specified table
    const { error } = await supabaseAdmin
      .from(tableName)
      .update({ description_embedding: embedding })
      .eq('id', recordId);

    if (error) {
      console.error(`Error updating record in ${tableName}:${recordId}:`, error);
      throw error;
    }

    // 5. Return a success response
    return new Response(JSON.stringify({ success: true, message: `Embedding generated for ${tableName}:${recordId}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("Error in generate-embedding function:", err);
    // Return an error response
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
