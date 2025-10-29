do $$
begin
    -- organizations
    execute $sql$
        alter table public.organizations enable row level security;
        drop policy if exists "Organizations full access" on public.organizations;
        create policy "Organizations full access" on public.organizations
            for all
            using (auth.role() in ('authenticated', 'service_role'))
            with check (auth.role() in ('authenticated', 'service_role'));
    $sql$;

    -- employees
    execute $sql$
        alter table public.employees enable row level security;
        drop policy if exists "Employees full access" on public.employees;
        create policy "Employees full access" on public.employees
            for all
            using (auth.role() in ('authenticated', 'service_role'))
            with check (auth.role() in ('authenticated', 'service_role'));
    $sql$;

    -- contacts
    execute $sql$
        alter table public.contacts enable row level security;
        drop policy if exists "Contacts full access" on public.contacts;
        create policy "Contacts full access" on public.contacts
            for all
            using (auth.role() in ('authenticated', 'service_role'))
            with check (auth.role() in ('authenticated', 'service_role'));
    $sql$;

    -- deals
    execute $sql$
        alter table public.deals enable row level security;
        drop policy if exists "Deals full access" on public.deals;
        create policy "Deals full access" on public.deals
            for all
            using (auth.role() in ('authenticated', 'service_role'))
            with check (auth.role() in ('authenticated', 'service_role'));
    $sql$;

    -- tasks
    execute $sql$
        alter table public.tasks enable row level security;
        drop policy if exists "Tasks full access" on public.tasks;
        create policy "Tasks full access" on public.tasks
            for all
            using (auth.role() in ('authenticated', 'service_role'))
            with check (auth.role() in ('authenticated', 'service_role'));
    $sql$;

    -- projects
    execute $sql$
        alter table public.projects enable row level security;
        drop policy if exists "Projects full access" on public.projects;
        create policy "Projects full access" on public.projects
            for all
            using (auth.role() in ('authenticated', 'service_role'))
            with check (auth.role() in ('authenticated', 'service_role'));
    $sql$;

    -- products
    execute $sql$
        alter table public.products enable row level security;
        drop policy if exists "Products full access" on public.products;
        create policy "Products full access" on public.products
            for all
            using (auth.role() in ('authenticated', 'service_role'))
            with check (auth.role() in ('authenticated', 'service_role'));
    $sql$;
end$$;
