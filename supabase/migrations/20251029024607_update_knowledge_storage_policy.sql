drop policy if exists "Admins can manage knowledge files" on storage.objects;

create policy "Admins can manage knowledge files" on storage.objects
    for all using (
        bucket_id = 'knowledge-files'
        and (
            auth.role() = 'service_role'
            or exists (
                select 1
                from public.user_profiles up
                where up.id = auth.uid()
                  and (
                      coalesce(up.is_admin, false)
                      or up.role = 'super_admin'
                  )
            )
        )
    )
    with check (
        bucket_id = 'knowledge-files'
        and (
            auth.role() = 'service_role'
            or exists (
                select 1
                from public.user_profiles up
                where up.id = auth.uid()
                  and (
                      coalesce(up.is_admin, false)
                      or up.role = 'super_admin'
                  )
            )
        )
    );
