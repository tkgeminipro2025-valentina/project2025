create or replace view public.crm_ai_documents as
select
    'product'::text as source,
    p.id as record_id,
    p.name as title,
    coalesce(p.description, '') as content,
    p.description_embedding as embedding,
    jsonb_build_object(
        'price', p.price,
        'type', p.type,
        'created_at', p.created_at
    ) as metadata
from public.products p
where p.description is not null
  and p.description_embedding is not null
union all
select
    'organization'::text as source,
    o.id as record_id,
    o.name as title,
    coalesce(o.description, '') as content,
    o.description_embedding as embedding,
    jsonb_build_object(
        'industry', o.industry,
        'website', o.website,
        'phone', o.phone,
        'created_at', o.created_at
    ) as metadata
from public.organizations o
where o.description is not null
  and o.description_embedding is not null;

create or replace function public.match_crm_documents(
    query_embedding extensions.vector(768),
    match_count integer default 5,
    filter_source text default null
)
returns table (
    source text,
    record_id uuid,
    title text,
    content text,
    metadata jsonb,
    similarity double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
    select
        source,
        record_id,
        title,
        content,
        metadata,
        1 / (1 + (embedding <-> query_embedding)) as similarity
    from public.crm_ai_documents
    where embedding is not null
      and (filter_source is null or source = filter_source)
    order by embedding <-> query_embedding
    limit greatest(coalesce(match_count, 5), 1)
$$;

grant execute on function public.match_crm_documents(extensions.vector, integer, text) to public;

create or replace function public.crm_ai_context()
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
    with totals as (
        select jsonb_build_object(
            'organizations', (select count(*) from public.organizations),
            'contacts', (select count(*) from public.contacts),
            'deals', (select count(*) from public.deals),
            'open_deals', (select count(*) from public.deals where stage not in ('won','lost')),
            'pipeline_value', coalesce((select sum(amount) from public.deals where stage <> 'lost'), 0)
        ) as payload
    ),
    top_deals as (
        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'deal_name', deal_name,
                    'amount', amount,
                    'stage', stage,
                    'organization', organization_name,
                    'close_date', close_date
                )
                order by amount desc
            ),
            '[]'::jsonb
        ) as payload
        from (
            select
                d.deal_name,
                d.amount,
                d.stage,
                d.close_date,
                o.name as organization_name
            from public.deals d
            left join public.organizations o on o.id = d.organization_id
            order by d.amount desc
            limit 5
        ) deals_top
    ),
    upcoming_tasks as (
        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'title', title,
                    'due_date', due_date,
                    'priority', priority,
                    'status', status,
                    'related_to', related_to
                )
                order by due_date asc
            ),
            '[]'::jsonb
        ) as payload
        from (
            select title, due_date, priority, status, related_to
            from public.tasks
            where status <> 'Done'
            order by due_date asc
            limit 5
        ) task_list
    ),
    recent_orgs as (
        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'name', name,
                    'industry', industry,
                    'created_at', created_at
                )
                order by created_at desc
            ),
            '[]'::jsonb
        ) as payload
        from (
            select name, industry, created_at
            from public.organizations
            order by created_at desc
            limit 5
        ) org_list
    )
    select jsonb_build_object(
        'generated_at', now()::text,
        'totals', (select payload from totals),
        'top_deals', (select payload from top_deals),
        'upcoming_tasks', (select payload from upcoming_tasks),
        'recent_organizations', (select payload from recent_orgs)
    );
$$;

grant execute on function public.crm_ai_context() to public;
