create type public.user_role as enum ('super_admin', 'manager', 'staff', 'viewer');

create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    role user_role not null default 'staff',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create extension if not exists "moddatetime";
create trigger set_user_profiles_updated_at
    before update on public.user_profiles
    for each row execute procedure moddatetime (updated_at);

alter table public.user_profiles enable row level security;

create or replace function public.current_user_role()
returns user_role
language sql
stable
as $$
    select coalesce(
        (select role from public.user_profiles where id = auth.uid()),
        'viewer'::user_role
    );
$$;

create policy "Users can read own profile" on public.user_profiles
    for select using (auth.uid() = id);

create policy "Users can update own profile" on public.user_profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Admins manage profiles" on public.user_profiles
    for all using (public.current_user_role() = 'super_admin')
    with check (public.current_user_role() = 'super_admin');

