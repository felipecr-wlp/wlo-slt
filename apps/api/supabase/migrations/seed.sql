-- seed.sql — Datos de prueba

-- Formulario de ejemplo
insert into public.forms (id, title, fields, routing, group_name) values
('demo-contact', 'Contacto Demo', '[
  {"type":"text","label":"Nombre","name":"nombre","required":true},
  {"type":"email","label":"Email","name":"email","required":true},
  {"type":"tel","label":"Teléfono","name":"telefono"},
  {"type":"textarea","label":"Mensaje","name":"mensaje"}
]', '{"email_notify":true,"email_to":"ventas@ejemplo.com","email_subject":"Nuevo lead: {slt_nombre}","email_body":"<h3>Nuevo lead: {slt_nombre}</h3><p>Email: {slt_email}</p><hr>{all_fields}"}', 'General');

-- Shortlink de ejemplo
insert into public.short_links (id, name, slug, target_url, plataforma) values
('lnk_demo', 'Demo Landing', 'demo', 'https://ejemplo.com/landing?utm_source=slt', 'General');

-- Shortlink adicional
insert into public.short_links (id, name, slug, target_url, plataforma) values
('lnk_pricing', 'Pricing', 'pricing', 'https://ejemplo.com/pricing', 'Google');

-- Regla IP de ejemplo (bloqueo de una red)
insert into public.ip_rules (ip_cidr, rule_type, reason, created_by) values
('0.0.0.0/0', 'allow', 'placeholder allow-all for demo', 'seed');
