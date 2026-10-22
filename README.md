# Consultorio Psicológico Infantil "Un Rayito de Sol"

Aplicación web del consultorio, desarrollada con **Node.js + Express + PostgreSQL**
para la materia de *Seguridad y Desarrollo Web*.

## Requisitos

- Node.js 18 o superior
- PostgreSQL 14 o superior

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear la base de datos y cargar el esquema:

   ```bash
   createdb rayito_de_sol
   psql -d rayito_de_sol -f schema.sql
   ```

3. Copiar `.env.example` a `.env` y completar los valores
   (base de datos, `SESSION_SECRET` y las llaves de reCAPTCHA).

4. Arrancar el servidor:

   ```bash
   npm start
   ```

   y abrir <http://localhost:3000>.

## Roles

Cada usuario tiene un rol en la columna `usuarios.rol`:

| Rol             | Panel que ve            |
| --------------- | ----------------------- |
| `paciente`      | Panel de paciente       |
| `medico`        | Panel de médico         |
| `administrador` | Panel de administrador  |

Cualquier registro nuevo se crea con el rol `paciente`.

## Estructura

```
app.js                 Punto de entrada (helmet, sesión, CSRF, rutas)
database/conexion.js   Pool de PostgreSQL
middleware/            CSRF y límite de peticiones
routes/                auth (sesión), dashboard (privado), public (libre)
services/email.js      Envío del correo de recuperación
models/                Clases de datos
views/                 Plantillas EJS + partials
public/                CSS y JavaScript del navegador
schema.sql             Esquema de la base de datos
docs/                  Documentación de seguridad
```

## Seguridad

- Contraseñas con `bcrypt` (coste 10).
- Consultas parametrizadas (sin inyección SQL).
- Regeneración de sesión al iniciar sesión (evita *session fixation*).
- Protección **CSRF** por token en todos los formularios.
- **Límite de peticiones** en login, registro y recuperación.
- Recuperación de contraseña con **token de un solo uso** y caducidad.
- Cabeceras de seguridad con `helmet` (incluida CSP).

El detalle de la auditoría está en [`docs/README-SEGURIDAD.md`](docs/README-SEGURIDAD.md).
