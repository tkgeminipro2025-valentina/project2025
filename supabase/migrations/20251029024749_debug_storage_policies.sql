create or replace view public.storage_policy_state as
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
where schemaname = 'storage'
  and tablename = 'objects';

grant select on public.storage_policy_state to anon, authenticated, service_role;
