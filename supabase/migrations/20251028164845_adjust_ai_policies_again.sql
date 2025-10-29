drop policy if exists "Users can create ai_sessions" on public.ai_sessions;
drop policy if exists "Users can update own ai_sessions" on public.ai_sessions;
drop policy if exists "Users can create ai_messages" on public.ai_messages;
drop policy if exists "Users can create ai_feedback" on public.ai_feedback;
drop policy if exists "Users can update ai_feedback" on public.ai_feedback;

create policy "Users can create ai_sessions" on public.ai_sessions
    for insert
    with check (
        auth.role() = 'service_role'
        or (
            auth.uid() is not null
            and coalesce(created_by, auth.uid()) = auth.uid()
        )
    );

create policy "Users can update own ai_sessions" on public.ai_sessions
    for update
    using (
        auth.role() = 'service_role'
        or public.is_claims_admin()
        or created_by = auth.uid()
    )
    with check (
        auth.role() = 'service_role'
        or public.is_claims_admin()
        or created_by = auth.uid()
    );

create policy "Users can create ai_messages" on public.ai_messages
    for insert
    with check (
        auth.role() = 'service_role'
        or (
            auth.uid() is not null
            and exists (
                select 1
                from public.ai_sessions s
                where s.id = ai_messages.session_id
                  and (
                      s.created_by = auth.uid()
                      or public.is_claims_admin()
                  )
            )
        )
    );

create policy "Users can create ai_feedback" on public.ai_feedback
    for insert
    with check (
        auth.role() = 'service_role'
        or (
            auth.uid() is not null
            and exists (
                select 1
                from public.ai_sessions s
                where s.id = ai_feedback.session_id
                  and (
                      s.created_by = auth.uid()
                      or public.is_claims_admin()
                  )
            )
        )
    );

create policy "Users can update ai_feedback" on public.ai_feedback
    for update
    using (
        auth.role() = 'service_role'
        or public.is_claims_admin()
        or (
            created_by = auth.uid()
            and exists (
                select 1
                from public.ai_sessions s
                where s.id = ai_feedback.session_id
                  and (
                      s.created_by = auth.uid()
                      or public.is_claims_admin()
                  )
            )
        )
    )
    with check (
        auth.role() = 'service_role'
        or public.is_claims_admin()
        or (
            created_by = auth.uid()
            and exists (
                select 1
                from public.ai_sessions s
                where s.id = ai_feedback.session_id
                  and (
                      s.created_by = auth.uid()
                      or public.is_claims_admin()
                  )
            )
        )
    );
