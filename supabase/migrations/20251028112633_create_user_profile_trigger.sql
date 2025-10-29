create or replace function public.handle_new_user()
returns trigger
security definer
language plpgsql
as $$
begin
    insert into public.user_profiles (id, email, full_name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        coalesce((new.raw_user_meta_data->>'default_role')::public.user_role, 'staff')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
