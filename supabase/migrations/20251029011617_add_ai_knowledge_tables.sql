create table if not exists public.ai_knowledge_documents (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    source_type text not null default 'manual',
    file_name text,
    mime_type text,
    storage_path text,
    metadata jsonb,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id)
);

create table if not exists public.ai_knowledge_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.ai_knowledge_documents(id) on delete cascade,
    chunk_index integer not null default 0,
    content text not null,
    embedding extensions.vector(768),
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index if not exists ai_knowledge_chunks_document_idx on public.ai_knowledge_chunks (document_id);


alter table public.ai_knowledge_documents enable row level security;
alter table public.ai_knowledge_chunks enable row level security;

create policy "Admins manage knowledge documents" on public.ai_knowledge_documents
    for all using (auth.role() = 'service_role' or public.is_claims_admin())
    with check (auth.role() = 'service_role' or public.is_claims_admin());

create policy "Admins manage knowledge chunks" on public.ai_knowledge_chunks
    for all using (auth.role() = 'service_role' or public.is_claims_admin())
    with check (auth.role() = 'service_role' or public.is_claims_admin());

