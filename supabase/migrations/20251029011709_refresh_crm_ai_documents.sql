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
  and o.description_embedding is not null
union all
select
    'knowledge_base'::text as source,
    c.id as record_id,
    d.title as title,
    c.content as content,
    c.embedding as embedding,
    coalesce(c.metadata, '{}'::jsonb) || jsonb_build_object(
        'document_id', d.id,
        'description', d.description,
        'source_type', d.source_type,
        'file_name', d.file_name,
        'mime_type', d.mime_type
    ) as metadata
from public.ai_knowledge_chunks c
join public.ai_knowledge_documents d on d.id = c.document_id
where c.embedding is not null;
