# Auditoría con Burp Suite

## Herramientas

* Burp Suite Community

## Configuración

Proxy configurado correctamente.

## Pruebas realizadas

### Login

Resultado:

Correcto.

Observaciones:

Las peticiones POST fueron interceptadas correctamente.

---

### Cookies

Se verificó:

* HttpOnly
* Secure
* SameSite=Lax

Resultado:

Correcto.

---

### Headers

Verificados:

* HSTS
* X-Frame-Options
* X-Content-Type-Options
* Referrer-Policy

Resultado:

Correcto.

---

### Próximas pruebas

* Manipulación de peticiones.
* CSRF.
* XSS.
* Fuerza bruta.
* Escalación de privilegios.
