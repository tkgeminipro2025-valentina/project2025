create or replace function public.ai_usage_by_day()
returns table(
    day date,
    channel text,
    sessions bigint,
    messages bigint,
    positive_feedback bigint,
    negative_feedback bigint
)
language sql
stable
as $$
    select
        date_trunc('day', s.created_at)::date as day,
        s.channel,
        count(distinct s.id) as sessions,
        coalesce(sum(mcount.total_messages), 0) as messages,
        coalesce(sum(coalesce(fpos.positive_feedback, 0)), 0) as positive_feedback,
        coalesce(sum(coalesce(fneg.negative_feedback, 0)), 0) as negative_feedback
    from ai_sessions s
    left join (
        select session_id, count(*) as total_messages
        from ai_messages
        group by session_id
    ) mcount on mcount.session_id = s.id
    left join (
        select session_id, count(*) as positive_feedback
        from ai_feedback
        where rating = 1
        group by session_id
    ) fpos on fpos.session_id = s.id
    left join (
        select session_id, count(*) as negative_feedback
        from ai_feedback
        where rating = -1
        group by session_id
    ) fneg on fneg.session_id = s.id
    group by day, s.channel
    order by day desc, s.channel;
$$;
