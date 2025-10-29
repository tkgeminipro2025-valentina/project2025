-- Schema definition for Stellar AI CRM
create extension if not exists "pgcrypto";
create extension if not exists moddatetime;
create extension if not exists vector with schema extensions;

create type contact_status as enum ('lead', 'client', 'student', 'lost', 'other');
create type deal_stage as enum ('new', 'quoting', 'won', 'lost');
create type product_type as enum ('solution', 'training');
create type project_status as enum ('planning', 'running', 'completed', 'on_hold');
create type task_priority as enum ('High', 'Medium', 'Low');
create type task_state as enum ('To Do', 'In Progress', 'Done');

create type user_role as enum ('super_admin', 'manager', 'staff', 'viewer');

create table if not exists organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    industry text,
    website text,
    phone text,
    address text,
    description text,
    description_embedding extensions.vector(768),
    created_at timestamptz not null default now()
);

create table if not exists employees (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    job_title text not null,
    phone text,
    created_at timestamptz not null default now()
);

create table if not exists contacts (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null,
    phone text,
    title text,
    status contact_status not null default 'lead',
    organization_id uuid references organizations(id) on delete set null,
    created_at timestamptz not null default now()
);

create unique index if not exists contacts_email_idx on contacts (lower(email));

create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    price numeric(12,2) not null,
    type product_type not null,
    description_embedding extensions.vector(768),
    created_at timestamptz not null default now()
);

create table if not exists deals (
    id uuid primary key default gen_random_uuid(),
    deal_name text not null,
    amount numeric(14,2) not null,
    stage deal_stage not null default 'new',
    close_date date,
    contact_id uuid references contacts(id) on delete set null,
    organization_id uuid references organizations(id) on delete set null,
    assigned_to_employee_id uuid references employees(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists projects (
    id uuid primary key default gen_random_uuid(),
    project_name text not null,
    status project_status not null default 'planning',
    start_date date,
    end_date date,
    manager_employee_id uuid references employees(id) on delete set null,
    organization_id uuid references organizations(id) on delete set null,
    description text,
    created_at timestamptz not null default now()
);

create table if not exists tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    due_date date not null,
    priority task_priority not null default 'Medium',
    status task_state not null default 'To Do',
    related_to jsonb,
    created_at timestamptz not null default now()
);

create index if not exists tasks_related_to_gin_idx on tasks using gin(related_to);

create table if not exists user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    role user_role not null default 'staff',
    is_admin boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger set_user_profiles_updated_at
    before update on user_profiles
    for each row execute procedure moddatetime (updated_at);

alter table if exists user_profiles enable row level security;

create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select role from user_profiles where id = auth.uid()),
        'viewer'::user_role
    );
$$;

create policy "Users can read own profile" on user_profiles
    for select using (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Admins manage profiles" on user_profiles
    for all using (current_user_role() = 'super_admin')
    with check (current_user_role() = 'super_admin');

create or replace function handle_new_user()
returns trigger
security definer
language plpgsql
as $$
begin
    insert into user_profiles (id, email, full_name, role, is_admin)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        case
            when lower(new.email) = 'yvalentinaniehra@gmail.com' then 'super_admin'
            else coalesce((new.raw_user_meta_data->>'default_role')::user_role, 'staff')
        end,
        case
            when lower(new.email) = 'yvalentinaniehra@gmail.com' then true
            else coalesce((new.raw_app_meta_data->>'is_admin')::boolean, false)
        end
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

create table if not exists ai_sessions (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    created_by uuid,
    channel text not null default 'assistant',
    metadata jsonb,
    last_interaction_at timestamptz not null default now()
);

alter table if exists ai_sessions
    alter column created_by set default auth.uid();

create index if not exists ai_sessions_created_by_idx on ai_sessions (created_by);
create index if not exists ai_sessions_last_interaction_idx on ai_sessions (last_interaction_at desc);

create table if not exists ai_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references ai_sessions(id) on delete cascade,
    role text not null check (role in ('user','assistant','system')),
    content text not null,
    tokens int,
    created_at timestamptz not null default now()
);

create index if not exists ai_messages_session_id_created_at_idx on ai_messages (session_id, created_at);

create table if not exists ai_feedback (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references ai_sessions(id) on delete cascade,
    message_id uuid references ai_messages(id) on delete set null,
    rating smallint not null check (rating between -1 and 1),
    comment text,
    created_at timestamptz not null default now(),
    created_by uuid
);

alter table if exists ai_feedback
    alter column created_by set default auth.uid();

create index if not exists ai_feedback_session_idx on ai_feedback (session_id);
create unique index if not exists ai_feedback_session_message_idx
    on ai_feedback (session_id, message_id)
    where message_id is not null;
create index if not exists ai_feedback_created_by_idx on ai_feedback (created_by);

create or replace view ai_session_summary as
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

create or replace function ai_usage_by_day()
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

alter table if exists ai_sessions enable row level security;
alter table if exists ai_messages enable row level security;
alter table if exists ai_feedback enable row level security;

create or replace function is_claims_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        coalesce((auth.jwt()->'is_admin')::boolean, false)
        or current_user_role() in ('super_admin', 'manager')
        or exists (
            select 1
            from user_profiles up
            where up.id = auth.uid()
              and coalesce(up.is_admin, false)
        )
        or auth.role() = 'service_role';
$$;

create policy "Admins can read ai_sessions" on ai_sessions
    for select using (
        auth.role() = 'service_role' or is_claims_admin()
    );

create policy "Admins can read ai_messages" on ai_messages
    for select using (
        auth.role() = 'service_role' or is_claims_admin()
    );

create policy "Admins can read ai_feedback" on ai_feedback
    for select using (
        auth.role() = 'service_role' or is_claims_admin()
    );

create policy "Users can create ai_sessions" on ai_sessions
    for insert
    with check (auth.uid() is not null or auth.role() = 'service_role');

create policy "Users can update own ai_sessions" on ai_sessions
    for update
    using (auth.role() = 'service_role' or created_by = auth.uid())
    with check (auth.role() = 'service_role' or created_by = auth.uid());

create policy "Users can create ai_messages" on ai_messages
    for insert
    with check (auth.uid() is not null or auth.role() = 'service_role');

create policy "Users can create ai_feedback" on ai_feedback
    for insert
    with check (auth.uid() is not null or auth.role() = 'service_role');

create policy "Users can update ai_feedback" on ai_feedback
    for update
    using (auth.role() = 'service_role' or created_by = auth.uid())
    with check (auth.role() = 'service_role' or created_by = auth.uid());

create table if not exists ai_knowledge_documents (
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

create table if not exists ai_knowledge_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references ai_knowledge_documents(id) on delete cascade,
    chunk_index integer not null default 0,
    content text not null,
    embedding extensions.vector(768),
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index if not exists ai_knowledge_chunks_document_idx on ai_knowledge_chunks (document_id);

alter table if exists ai_knowledge_documents enable row level security;
alter table if exists ai_knowledge_chunks enable row level security;

create policy "Admins manage knowledge documents" on ai_knowledge_documents
    for all using (auth.role() = 'service_role' or is_claims_admin())
    with check (auth.role() = 'service_role' or is_claims_admin());

create policy "Admins manage knowledge chunks" on ai_knowledge_chunks
    for all using (auth.role() = 'service_role' or is_claims_admin())
    with check (auth.role() = 'service_role' or is_claims_admin());

