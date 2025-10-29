create table if not exists public.ai_sessions (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    created_by uuid,
    channel text not null default 'assistant',
    metadata jsonb,
    last_interaction_at timestamptz not null default now()
);

create index if not exists ai_sessions_created_by_idx on public.ai_sessions (created_by);
create index if not exists ai_sessions_last_interaction_idx on public.ai_sessions (last_interaction_at desc);

create table if not exists public.ai_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.ai_sessions(id) on delete cascade,
    role text not null check (role in ('user','assistant','system')),
    content text not null,
    tokens int,
    created_at timestamptz not null default now()
);

create index if not exists ai_messages_session_id_created_at_idx on public.ai_messages (session_id, created_at);

create table if not exists public.ai_feedback (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.ai_sessions(id) on delete cascade,
    message_id uuid references public.ai_messages(id) on delete set null,
    rating smallint not null check (rating between -1 and 1),
    comment text,
    created_at timestamptz not null default now(),
    created_by uuid
);

create index if not exists ai_feedback_session_idx on public.ai_feedback (session_id);
