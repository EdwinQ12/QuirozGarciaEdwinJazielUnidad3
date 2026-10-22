-- ============================================================
--  Esquema de la base de datos
--  Consultorio Psicológico Infantil "Un Rayito de Sol"
--  Motor: PostgreSQL
--
--  Uso:
--      createdb rayito_de_sol
--      psql -d rayito_de_sol -f schema.sql
-- ============================================================

-- Usuarios del sistema (pacientes, médicos y administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(120) NOT NULL,
    correo    VARCHAR(160) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    rol       VARCHAR(20)  NOT NULL DEFAULT 'paciente'
              CHECK (rol IN ('paciente', 'medico', 'administrador')),
    creado_en TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Si ya tenías la tabla `usuarios` creada sin la columna `rol`, ejecuta:
--   ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'paciente';

-- Buzón de sugerencias (área privada)
CREATE TABLE IF NOT EXISTS buzon (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(120) NOT NULL,
    asunto  VARCHAR(160) NOT NULL,
    mensaje TEXT         NOT NULL,
    fecha   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Chat de comentarios (área privada)
CREATE TABLE IF NOT EXISTS chat (
    id      SERIAL PRIMARY KEY,
    usuario VARCHAR(120) NOT NULL,
    mensaje TEXT         NOT NULL,
    fecha   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tokens de recuperación de contraseña.
-- Se guarda el HASH del token, nunca el token en claro.
CREATE TABLE IF NOT EXISTS reset_tokens (
    id         SERIAL PRIMARY KEY,
    correo     VARCHAR(160) NOT NULL,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    expira     TIMESTAMP    NOT NULL,
    usado      BOOLEAN      NOT NULL DEFAULT false,
    creado_en  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_usuarios_correo_lower ON usuarios (LOWER(correo));
