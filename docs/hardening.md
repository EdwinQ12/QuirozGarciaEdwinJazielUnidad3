# Hardening de la Aplicación

## Mejoras implementadas

### Helmet

Implementado mediante:

helmet()

Protecciones obtenidas:

* X-Frame-Options
* X-Content-Type-Options
* Referrer-Policy
* HSTS
* Origin-Agent-Cluster
* Cross-Origin-Opener-Policy
* Cross-Origin-Resource-Policy

---

### Cookies

Configuración:

* HttpOnly
* Secure
* SameSite=Lax

---

### Sesiones

Mejoras:

* Regeneración de sesión.
* Variables mínimas dentro de la sesión.

---

### Inicio de sesión

Cambios:

* Eliminación de mensajes específicos.
* Protección contra enumeración de usuarios.

---

### Contraseñas

* bcrypt
* Salt automático
* Verificación mediante bcrypt.compare()
