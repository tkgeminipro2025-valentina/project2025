create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select role from public.user_profiles where id = auth.uid()),
        'viewer'::public.user_role
    );
$$;

create or replace function public.is_claims_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        coalesce((auth.jwt()->'is_admin')::boolean, false)
        or public.current_user_role() in ('super_admin', 'manager')
        or exists (
            select 1
            from public.user_profiles up
            where up.id = auth.uid()
              and coalesce(up.is_admin, false)
        )
        or auth.role() = 'service_role';
$$;
