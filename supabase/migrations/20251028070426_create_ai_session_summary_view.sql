create or replace view public.ai_session_summary as
select
    s.id,
    s.created_at,
    s.created_by,
    s.channel,
    s.last_interaction_at,
    coalesce(metadata, '{}'::jsonb) as metadata,
    (
        select count(*) from ai_messages m
        where m.session_id = s.id
    ) as total_messages,
    (
        select count(*) from ai_messages m
        where m.session_id = s.id and m.role = 'user'
    ) as user_messages,
    (
        select count(*) from ai_messages m
        where m.session_id = s.id and m.role = 'assistant'
    ) as assistant_messages,
    (
        select coalesce(sum(tokens), 0) from ai_messages m
        where m.session_id = s.id
    ) as total_tokens,
    (
        select avg(rating) from ai_feedback f
        where f.session_id = s.id
    ) as average_rating,
    (
        select count(*) from ai_feedback f
        where f.session_id = s.id and rating = 1
    ) as positive_feedback,
    (
        select count(*) from ai_feedback f
        where f.session_id = s.id and rating = -1
    ) as negative_feedback
from ai_sessions s;
