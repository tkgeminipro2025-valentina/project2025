create or replace function public.is_claims_admin()
returns boolean
language sql
stable
as $$
    select coalesce(
        (auth.jwt()->'is_admin')::boolean,
        false
    );
$$;

drop policy if exists "Allow read for analytics" on public.ai_sessions;
drop policy if exists "Allow read for analytics" on public.ai_messages;
drop policy if exists "Allow read for analytics" on public.ai_feedback;

create policy "Admins can read ai_sessions" on public.ai_sessions
    for select using (
        (auth.role() = 'service_role') or public.is_claims_admin()
    );

create policy "Admins can read ai_messages" on public.ai_messages
    for select using (
        (auth.role() = 'service_role') or public.is_claims_admin()
    );

create policy "Admins can read ai_feedback" on public.ai_feedback
    for select using (
        (auth.role() = 'service_role') or public.is_claims_admin()
    );
