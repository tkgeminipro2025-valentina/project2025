create or replace function public.is_claims_admin()
returns boolean
language sql
stable
as $$
    select
        coalesce((auth.jwt()->'is_admin')::boolean, false)
        or current_user_role() in ('super_admin', 'manager')
        or auth.role() = 'service_role';
$$;
