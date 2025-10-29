-- Ensure the pgvector extension exists (no-op if already installed)
create extension if not exists vector;

-- Align embedding vector dimensions with Gemini text-embedding-004 (768 dimensions)
alter table if exists public.products
    drop column if exists description_embedding;
alter table if exists public.products
    add column description_embedding extensions.vector(768);

alter table if exists public.organizations
    drop column if exists description_embedding;
alter table if exists public.organizations
    add column description_embedding extensions.vector(768);
