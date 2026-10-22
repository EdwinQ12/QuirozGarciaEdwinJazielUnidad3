# Hallazgos de Seguridad

## Hallazgo 001

### Enumeración de usuarios

Estado: Corregido

Descripción:

El sistema mostraba mensajes distintos dependiendo de si el correo existía o no.

Ejemplos:

* Usuario no encontrado.
* Contraseña incorrecta.

Esto permitía a un atacante identificar cuentas registradas.

Corrección aplicada:

Se reemplazaron ambos mensajes por:

"Usuario o contraseña incorrectos."

Impacto:

Reduce la posibilidad de enumeración de usuarios.

Fecha:

Julio 2026.

---

## Hallazgo 002

### Session Fixation

Estado: Corregido

Descripción:

La sesión no era regenerada después del inicio de sesión.

Corrección:

Se implementó:

req.session.regenerate()

Impacto:

Evita ataques de fijación de sesión.

---

## Hallazgo 003

### Cookies poco protegidas

Estado: Corregido

Descripción:

Las cookies únicamente utilizaban HttpOnly.

Corrección:

Se agregaron:

* HttpOnly
* Secure
* SameSite=Lax

Impacto:

Mayor protección frente a robo de cookies y ataques CSRF.
