-- 002_forms.sql — Form Builder + Submissions

-- Formularios (definición)
create table public.forms (
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

create index idx_forms_group on public.forms (group_name);
create index idx_forms_status on public.forms (status);

-- Envíos de formularios (leads)
create table public.form_submissions (
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

create index idx_submissions_form_created on public.form_submissions (form_id, created_at desc);
create index idx_submissions_email on public.form_submissions (lead_email);
create index idx_submissions_session on public.form_submissions (session_id);
