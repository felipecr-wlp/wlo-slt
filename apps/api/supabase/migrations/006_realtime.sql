-- 006_realtime.sql — Supabase Realtime + RLS

-- Habilitar Realtime en tablas clave
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.form_submissions;
alter publication supabase_realtime add table public.redirect_clicks;

-- Row Level Security (para cuando añadas auth)
alter table public.events enable row level security;
alter table public.sessions enable row level security;
alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;
alter table public.short_links enable row level security;
alter table public.redirect_clicks enable row level security;
alter table public.integration_logs enable row level security;

-- Políticas públicas de lectura (dashboard sin auth por ahora)
create policy "public read events" on public.events for select using (true);
create policy "public read sessions" on public.sessions for select using (true);
create policy "public read forms" on public.forms for select using (true);
create policy "public read submissions" on public.form_submissions for select using (true);
create policy "public read short_links" on public.short_links for select using (true);
create policy "public read redirect_clicks" on public.redirect_clicks for select using (true);
create policy "public read integration_logs" on public.integration_logs for select using (true);

-- Escritura solo vía service_role (API routes)
create policy "service write events" on public.events for insert with check (true);
create policy "service write sessions" on public.sessions for insert with check (true);
create policy "service upsert sessions" on public.sessions for update using (true);
create policy "service write submissions" on public.form_submissions for insert with check (true);
create policy "service write redirect_clicks" on public.redirect_clicks for insert with check (true);
create policy "service write integration_logs" on public.integration_logs for insert with check (true);
