alter table public.ai_sessions enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_feedback enable row level security;

create policy "Allow read for analytics" on public.ai_sessions
    for select using (true);
create policy "Allow read for analytics" on public.ai_messages
    for select using (true);
create policy "Allow read for analytics" on public.ai_feedback
    for select using (true);
