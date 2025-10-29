insert into storage.buckets (id, name, public)
values ('knowledge-files', 'knowledge-files', false)
on conflict (id) do nothing;

create policy "Admins can manage knowledge files"
on storage.objects
for all
using (
    bucket_id = 'knowledge-files'
    and (
        auth.role() = 'service_role'
        or public.is_claims_admin()
    )
)
with check (
    bucket_id = 'knowledge-files'
    and (
        auth.role() = 'service_role'
        or public.is_claims_admin()
    )
);
