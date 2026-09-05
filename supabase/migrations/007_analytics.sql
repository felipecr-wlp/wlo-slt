-- Tabla de eventos SLT (analytics)
CREATE TABLE IF NOT EXISTS slt_eventos (
    id BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT NOW() NOT NULL,
    url_pagina VARCHAR(255) NOT NULL,
    elemento_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(100),
    user_email VARCHAR(100),
    user_phone VARCHAR(50),
    user_ip VARCHAR(45),
    fingerprint VARCHAR(100),
    user_profile VARCHAR(150),
    observaciones TEXT
);

CREATE INDEX IF NOT EXISTS idx_slt_session ON slt_eventos(session_id);
CREATE INDEX IF NOT EXISTS idx_slt_fecha ON slt_eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_slt_url ON slt_eventos(url_pagina);

-- Tabla de carpetas (configuración de analytics)
CREATE TABLE IF NOT EXISTS slt_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#2271b1',
    launch_date DATE DEFAULT CURRENT_DATE,
    urls JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
