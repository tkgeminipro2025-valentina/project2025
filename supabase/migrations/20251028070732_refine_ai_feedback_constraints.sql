create unique index if not exists ai_feedback_session_message_idx
    on public.ai_feedback (session_id, message_id)
    where message_id is not null;

create index if not exists ai_feedback_created_by_idx on public.ai_feedback (created_by);
