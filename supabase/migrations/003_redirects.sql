-- 003_redirects.sql — Enrutador Omnicanal (Shortlinks)

-- Enlaces cortos / redirecciones
create table public.short_links (
    id              text primary key,
    name            text not null,
    slug            text not null unique,
    target_url      text not null,
    plataforma      text default 'General',
    clicks          int not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index idx_short_links_slug on public.short_links (slug);
create index idx_short_links_plataforma on public.short_links (plataforma);

-- Clics en redirecciones (analítica)
create table public.redirect_clicks (
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

create index idx_redirect_clicks_link_created on public.redirect_clicks (link_id, created_at desc);
create index idx_redirect_clicks_session on public.redirect_clicks (session_id);
