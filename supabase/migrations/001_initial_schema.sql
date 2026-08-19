-- 001_initial_schema.sql
-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tabla principal de eventos (tracking)
create table public.events (
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

create index idx_events_session_created on public.events (session_id, created_at desc);
create index idx_events_type_created on public.events (event_type, created_at desc);
create index idx_events_url_created on public.events (url, created_at desc);
create index idx_events_fingerprint on public.events (fingerprint);

-- Sesiones
create table public.sessions (
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

create index idx_sessions_last_seen on public.sessions (last_seen desc);

-- IPs bloqueadas / whitelist (WAF)
create table public.ip_rules (
    id              uuid primary key default gen_random_uuid(),
    ip_cidr         inet not null,
    rule_type       text not null,
    reason          text,
    created_by      text,
    expires_at      timestamptz,
    created_at      timestamptz not null default now()
);

create index idx_ip_rules_cidr on public.ip_rules using gist (ip_cidr inet_ops);
