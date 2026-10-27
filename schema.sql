-- ============================================================
--  Esquema de la base de datos
--  Consultorio Psicológico Infantil "Un Rayito de Sol"
--  Motor: PostgreSQL
--
--  Uso:
--      createdb rayito_de_sol
--      psql -d rayito_de_sol -f schema.sql
--
--  El script es idempotente: se puede volver a ejecutar sobre una
--  base que ya existe sin perder información.
-- ============================================================

-- ------------------------------------------------------------
--  Usuarios del sistema (pacientes, médicos y administradores)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(120) NOT NULL,
    correo    VARCHAR(160) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    rol       VARCHAR(20)  NOT NULL DEFAULT 'paciente'
              CHECK (rol IN ('paciente', 'medico', 'administrador')),
    creado_en TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Datos de contacto (se agregaron después, por eso van con ALTER)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono         VARCHAR(30);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- ------------------------------------------------------------
--  Especialistas del consultorio
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS especialistas (
    id           SERIAL PRIMARY KEY,
    nombre       VARCHAR(120) NOT NULL,
    especialidad VARCHAR(120) NOT NULL,
    descripcion  TEXT,
    activo       BOOLEAN NOT NULL DEFAULT true,
    creado_en    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Datos de ejemplo (solo si la tabla está vacía)
INSERT INTO especialistas (nombre, especialidad, descripcion)
SELECT v.nombre, v.especialidad, v.descripcion
FROM (VALUES
    ('Dra. Ana Martínez',   'Psicología Infantil',   'Atención a niñas y niños de 3 a 12 años.'),
    ('Dr. Carlos Hernández','Orientación Familiar',  'Acompañamiento a madres, padres y tutores.'),
    ('Lic. Sofía Ramírez',  'Terapia de Lenguaje',   'Evaluación y apoyo en la comunicación.'),
    ('Lic. Diego Torres',   'Psicopedagogía',        'Apoyo en el aprendizaje y los hábitos de estudio.')
) AS v(nombre, especialidad, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM especialistas);

-- ------------------------------------------------------------
--  Citas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id),
    fecha           DATE NOT NULL,
    hora            TIME NOT NULL,
    motivo          TEXT NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'confirmada', 'atendida', 'cancelada')),
    creado_en       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Un especialista no puede tener dos citas a la misma hora,
-- pero un horario cancelado sí puede volver a ocuparse.
CREATE UNIQUE INDEX IF NOT EXISTS idx_citas_horario
    ON citas (especialista_id, fecha, hora)
    WHERE estado <> 'cancelada';

CREATE INDEX IF NOT EXISTS idx_citas_usuario ON citas (usuario_id, fecha);

-- ------------------------------------------------------------
--  Diario de emociones (una entrada por día y por usuario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diario_emociones (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    emocion    VARCHAR(30) NOT NULL
               CHECK (emocion IN ('feliz', 'triste', 'enojado', 'asustado', 'cansado', 'tranquilo')),
    nota       TEXT,
    fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, fecha)
);

-- ------------------------------------------------------------
--  Buzón de sugerencias (área privada)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buzon (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(120) NOT NULL,
    asunto  VARCHAR(160) NOT NULL,
    mensaje TEXT         NOT NULL,
    fecha   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  Chat de comentarios (área privada)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat (
    id      SERIAL PRIMARY KEY,
    usuario VARCHAR(120) NOT NULL,
    mensaje TEXT         NOT NULL,
    fecha   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  Tokens de recuperación de contraseña.
--  Se guarda el HASH del token, nunca el token en claro.
-- ------------------------------------------------------------
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
