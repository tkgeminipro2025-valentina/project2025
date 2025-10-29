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
        case
            when lower(new.email) = 'yvalentinaniehra@gmail.com' then 'super_admin'
            else coalesce((new.raw_user_meta_data->>'default_role')::public.user_role, 'staff')
        end,
        case
            when lower(new.email) = 'yvalentinaniehra@gmail.com' then true
            else coalesce((new.raw_app_meta_data->>'is_admin')::boolean, false)
        end
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

update public.user_profiles
set
    role = 'super_admin',
    is_admin = true
where lower(email) = 'yvalentinaniehra@gmail.com';
