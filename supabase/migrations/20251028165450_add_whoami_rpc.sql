create or replace function public.debug_whoami()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'uid', auth.uid(),
        'role', auth.role(),
        'jwt', auth.jwt()
    );
$$;

grant execute on function public.debug_whoami() to public;
