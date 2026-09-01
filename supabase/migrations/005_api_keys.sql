-- 005_api_keys.sql — Gestión de API Keys para webhooks

create table public.api_keys (
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

create index idx_api_keys_hash on public.api_keys (key_hash);
create index idx_api_keys_endpoint on public.api_keys (endpoint);

-- Tabla de uso de API keys (log de requests)
create table public.api_key_usage (
    id              uuid primary key default gen_random_uuid(),
    api_key_id      uuid not null references public.api_keys(id) on delete cascade,
    endpoint        text not null,
    status          text not null,
    ip_address      text,
    created_at      timestamptz not null default now()
);

create index idx_api_key_usage_key_created on public.api_key_usage (api_key_id, created_at desc);
