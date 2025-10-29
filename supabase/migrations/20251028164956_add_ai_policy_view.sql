create or replace view public.ai_policy_state as
select
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive,
    qual,
    with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('ai_sessions', 'ai_messages', 'ai_feedback');
