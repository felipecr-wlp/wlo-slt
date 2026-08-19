-- 004_integrations.sql — Configs de Integraciones

create table public.integration_configs (
    id              uuid primary key default gen_random_uuid(),
    integration     text not null,
    config          jsonb not null,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (integration)
);

create table public.integration_logs (
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

create index idx_integration_logs_integration_created on public.integration_logs (integration, created_at desc);
create index idx_integration_logs_submission on public.integration_logs (submission_id);
