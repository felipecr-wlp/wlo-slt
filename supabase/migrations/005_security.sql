-- 005_security.sql — WAF, Rate Limit, Bots

-- Rate limiting (por IP + fingerprint)
create table public.rate_limits (
    id              uuid primary key default gen_random_uuid(),
    identifier      text not null,
    endpoint        text not null,
    count           int not null default 1,
    window_start    timestamptz not null default now(),
    blocked_until   timestamptz,
    unique (identifier, endpoint, window_start)
);

create index idx_rate_limits_window on public.rate_limits (window_start desc);

-- Honeypots / Trampas
create table public.honeypots (
    id              uuid primary key default gen_random_uuid(),
    path            text not null,
    trigger_count   int not null default 0,
    created_at      timestamptz not null default now()
);
