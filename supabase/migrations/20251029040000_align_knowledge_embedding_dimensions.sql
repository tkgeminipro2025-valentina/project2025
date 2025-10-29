-- Ensure vector dimension for knowledge chunks matches Gemini output (768)
alter table if exists public.ai_knowledge_chunks
    alter column embedding type extensions.vector(768);

comment on column public.ai_knowledge_chunks.embedding is
    'Stores Gemini text-embedding-004 vectors (768 dimensions).';
