# Checklist de Seguridad

## Estado general

* [x] Contraseñas almacenadas con bcrypt.
* [x] Consultas SQL parametrizadas.
* [x] Implementación de Google reCAPTCHA en el registro.
* [x] Middleware para proteger rutas privadas.
* [x] Cookies con HttpOnly.
* [x] Cookies con Secure.
* [x] Cookies con SameSite=Lax.
* [x] Regeneración de sesión al iniciar sesión (Session Fixation).
* [x] Helmet implementado.
* [x] Encabezados HTTP verificados.
* [x] Mensajes genéricos en el inicio de sesión para evitar enumeración de usuarios.

## Auditoría con Burp Suite

* [x] Instalación de Burp Suite Community.
* [x] Configuración del Proxy.
* [x] Interceptación de peticiones.
* [x] Uso de Repeater.
* [x] Análisis de cookies.
* [ ] Manipulación avanzada de peticiones.
* [ ] Pruebas de autorización.

## Pruebas pendientes

* [ ] Cross Site Scripting (XSS)
* [ ] Cross Site Request Forgery (CSRF)
* [ ] Rate Limiting
* [ ] Fuerza Bruta
* [ ] Validación de archivos
* [ ] Auditoría de roles
* [ ] Content Security Policy
* [ ] Registro de eventos de seguridad
* [ ] Cierre de sesión automático por inactividad
