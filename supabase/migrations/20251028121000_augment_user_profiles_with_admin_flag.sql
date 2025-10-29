alter table public.user_profiles
    add column if not exists is_admin boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
security definer
language plpgsql
as $$
begin
    insert into public.user_profiles (id, email, full_name, role, is_admin)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        coalesce((new.raw_user_meta_data->>'default_role')::public.user_role, 'staff'),
        coalesce((new.raw_app_meta_data->>'is_admin')::boolean, false)
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create or replace function public.is_claims_admin()
returns boolean
language sql
stable
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
