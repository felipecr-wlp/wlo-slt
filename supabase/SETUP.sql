-- ============================================================
-- wlo-slt: SCHEMA COMPLETO
-- Copiar y pegar en Supabase SQL Editor → RUN
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. EVENTS (tracking principal)
-- ============================================================
create table if not exists public.events (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid not null,
    event_type      text not null,
    element_id      text,
    url             text not null,
    referrer        text,
    utm_source      text,
    utm_medium      text,
    utm_campaign    text,
    utm_content     text,
    utm_term        text,
    gclid           text,
    fbclid          text,
    user_agent      text,
    fingerprint     text,
    ip_hash         text,
    country         text,
    city            text,
    device_type     text,
    browser         text,
    os              text,
    screen_res      text,
    cores           int,
    memory_gb       int,
    connection_type text,
    payload         jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index if not exists idx_events_session_created on public.events (session_id, created_at desc);
create index if not exists idx_events_type_created on public.events (event_type, created_at desc);
create index if not exists idx_events_url_created on public.events (url, created_at desc);
create index if not exists idx_events_fingerprint on public.events (fingerprint);

-- ============================================================
-- 2. SESSIONS
-- ============================================================
create table if not exists public.sessions (
    id              uuid primary key default gen_random_uuid(),
    fingerprint     text not null unique,
    first_seen      timestamptz not null default now(),
    last_seen       timestamptz not null default now(),
    page_count      int not null default 1,
    utm_source      text,
    utm_medium      text,
    utm_campaign    text,
    referrer        text,
    landing_url     text,
    is_bot          boolean not null default false,
    bot_reason      text,
    country         text,
    city            text,
    metadata        jsonb default '{}'::jsonb
);

create index if not exists idx_sessions_last_seen on public.sessions (last_seen desc);

-- ============================================================
-- 3. IP RULES (WAF)
-- ============================================================
create table if not exists public.ip_rules (
    id              uuid primary key default gen_random_uuid(),
    ip_cidr         inet not null,
    rule_type       text not null,
    reason          text,
    created_by      text,
    expires_at      timestamptz,
    created_at      timestamptz not null default now()
);

-- ============================================================
-- 4. FORMS
-- ============================================================
create table if not exists public.forms (
    id              text primary key,
    title           text not null,
    page_url        text,
    fields          jsonb not null default '[]'::jsonb,
    routing         jsonb not null default '{}'::jsonb,
    action_type     text not null default 'message',
    redirect_url    text,
    txt_submit      text default 'Enviar',
    txt_success     text default '¡Enviado!',
    txt_error       text default 'Error al enviar.',
    txt_next        text default 'Siguiente ➡️',
    txt_prev        text default '⬅️ Atrás',
    colors          jsonb default '{}'::jsonb,
    rules           jsonb default '[]'::jsonb,
    status          text not null default 'active',
    group_name      text default 'General',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_forms_group on public.forms (group_name);
create index if not exists idx_forms_status on public.forms (status);

-- ============================================================
-- 5. FORM SUBMISSIONS (leads)
-- ============================================================
create table if not exists public.form_submissions (
    id              uuid primary key default gen_random_uuid(),
    form_id         text not null references public.forms(id) on delete cascade,
    session_id      uuid,
    fingerprint     text,
    data            jsonb not null,
    lead_name       text,
    lead_email      text,
    lead_phone      text,
    referrer_url    text,
    utm_data        jsonb,
    technical       jsonb,
    routing_logs    jsonb,
    status          text not null default 'new',
    created_at      timestamptz not null default now()
);

create index if not exists idx_submissions_form_created on public.form_submissions (form_id, created_at desc);
create index if not exists idx_submissions_email on public.form_submissions (lead_email);
create index if not exists idx_submissions_session on public.form_submissions (session_id);

-- ============================================================
-- 6. SHORT LINKS (redirects)
-- ============================================================
create table if not exists public.short_links (
    id              text primary key,
    name            text not null,
    slug            text not null unique,
    target_url      text not null,
    plataforma      text default 'General',
    clicks          int not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_short_links_slug on public.short_links (slug);
create index if not exists idx_short_links_plataforma on public.short_links (plataforma);

-- ============================================================
-- 7. REDIRECT CLICKS
-- ============================================================
create table if not exists public.redirect_clicks (
    id              uuid primary key default gen_random_uuid(),
    link_id         text not null references public.short_links(id) on delete cascade,
    session_id      uuid,
    fingerprint     text,
    ip_hash         text,
    country         text,
    city            text,
    referrer        text,
    utm_source      text,
    utm_medium      text,
    utm_campaign    text,
    user_agent      text,
    device_type     text,
    created_at      timestamptz not null default now()
);

create index if not exists idx_redirect_clicks_link_created on public.redirect_clicks (link_id, created_at desc);
create index if not exists idx_redirect_clicks_session on public.redirect_clicks (session_id);

-- ============================================================
-- 8. INTEGRATION CONFIGS
-- ============================================================
create table if not exists public.integration_configs (
    id              uuid primary key default gen_random_uuid(),
    integration     text not null,
    config          jsonb not null,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (integration)
);

-- ============================================================
-- 9. INTEGRATION LOGS
-- ============================================================
create table if not exists public.integration_logs (
    id              uuid primary key default gen_random_uuid(),
    integration     text not null,
    form_id         text,
    submission_id   uuid,
    status          text not null,
    request_payload jsonb,
    response_body   jsonb,
    error_message   text,
    duration_ms     int,
    created_at      timestamptz not null default now()
);

create index if not exists idx_integration_logs_integration_created on public.integration_logs (integration, created_at desc);
create index if not exists idx_integration_logs_submission on public.integration_logs (submission_id);

-- ============================================================
-- 10. RATE LIMITS
-- ============================================================
create table if not exists public.rate_limits (
    id              uuid primary key default gen_random_uuid(),
    identifier      text not null,
    endpoint        text not null,
    count           int not null default 1,
    window_start    timestamptz not null default now(),
    blocked_until   timestamptz,
    unique (identifier, endpoint, window_start)
);

create index if not exists idx_rate_limits_window on public.rate_limits (window_start desc);

-- ============================================================
-- 11. HONEYPOTS
-- ============================================================
create table if not exists public.honeypots (
    id              uuid primary key default gen_random_uuid(),
    path            text not null,
    trigger_count   int not null default 0,
    created_at      timestamptz not null default now()
);

-- ============================================================
-- 12. API KEYS
-- ============================================================
create table if not exists public.api_keys (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    key_hash        text not null unique,
    key_prefix      text not null,
    endpoint        text not null default 'slt',
    is_active       boolean not null default true,
    permissions     jsonb not null default '[]'::jsonb,
    created_at      timestamptz not null default now(),
    last_used_at    timestamptz,
    expires_at      timestamptz
);

create index if not exists idx_api_keys_hash on public.api_keys (key_hash);
create index if not exists idx_api_keys_endpoint on public.api_keys (endpoint);

-- ============================================================
-- 13. API KEY USAGE
-- ============================================================
create table if not exists public.api_key_usage (
    id              uuid primary key default gen_random_uuid(),
    api_key_id      uuid not null references public.api_keys(id) on delete cascade,
    endpoint        text not null,
    status          text not null,
    ip_address      text,
    created_at      timestamptz not null default now()
);

create index if not exists idx_api_key_usage_key_created on public.api_key_usage (api_key_id, created_at desc);

-- ============================================================
-- 14. SLT EVENTOS (analytics del plugin)
-- ============================================================
create table if not exists public.slt_eventos (
    id              bigserial primary key,
    fecha           timestamp default now() not null,
    url_pagina      varchar(255) not null,
    elemento_id     varchar(100) not null,
    session_id      varchar(255) not null,
    user_name       varchar(100),
    user_email      varchar(100),
    user_phone      varchar(50),
    user_ip         varchar(45),
    fingerprint     varchar(100),
    user_profile    varchar(150),
    observaciones   text
);

create index if not exists idx_slt_session on public.slt_eventos(session_id);
create index if not exists idx_slt_fecha on public.slt_eventos(fecha);
create index if not exists idx_slt_url on public.slt_eventos(url_pagina);

-- ============================================================
-- 15. SLT FOLDERS (configuración de analytics)
-- ============================================================
create table if not exists public.slt_folders (
    id              uuid primary key default gen_random_uuid(),
    name            varchar(100) not null,
    color           varchar(7) default '#2271b1',
    launch_date     date default current_date,
    urls            jsonb default '[]'::jsonb,
    sort_order      int default 0,
    created_at      timestamptz default now()
);

-- ============================================================
-- RLS: Deshabilitado (usamos service_role en el backend)
-- ============================================================
alter table public.events disable row level security;
alter table public.sessions disable row level security;
alter table public.ip_rules disable row level security;
alter table public.forms disable row level security;
alter table public.form_submissions disable row level security;
alter table public.short_links disable row level security;
alter table public.redirect_clicks disable row level security;
alter table public.integration_configs disable row level security;
alter table public.integration_logs disable row level security;
alter table public.rate_limits disable row level security;
alter table public.honeypots disable row level security;
alter table public.api_keys disable row level security;
alter table public.api_key_usage disable row level security;
alter table public.slt_eventos disable row level security;
alter table public.slt_folders disable row level security;

-- ============================================================
-- DONE
-- ============================================================
