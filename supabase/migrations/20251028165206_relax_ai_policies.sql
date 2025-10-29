drop policy if exists "Users can create ai_sessions" on public.ai_sessions;
drop policy if exists "Users can update own ai_sessions" on public.ai_sessions;
drop policy if exists "Users can create ai_messages" on public.ai_messages;
drop policy if exists "Users can create ai_feedback" on public.ai_feedback;
drop policy if exists "Users can update ai_feedback" on public.ai_feedback;

create policy "Users can create ai_sessions" on public.ai_sessions
    for insert
    with check (auth.uid() is not null or auth.role() = 'service_role');

create policy "Users can update own ai_sessions" on public.ai_sessions
    for update
    using (auth.role() = 'service_role' or created_by = auth.uid())
    with check (auth.role() = 'service_role' or created_by = auth.uid());

create policy "Users can create ai_messages" on public.ai_messages
    for insert
    with check (auth.uid() is not null or auth.role() = 'service_role');

create policy "Users can create ai_feedback" on public.ai_feedback
    for insert
    with check (auth.uid() is not null or auth.role() = 'service_role');

create policy "Users can update ai_feedback" on public.ai_feedback
    for update
    using (auth.role() = 'service_role' or created_by = auth.uid())
    with check (auth.role() = 'service_role' or created_by = auth.uid());
