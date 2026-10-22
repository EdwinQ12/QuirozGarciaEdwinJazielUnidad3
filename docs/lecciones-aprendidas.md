Fecha

07/07/2026

Tema

Session Fixation

Aprendí que...

Una sesión nunca debe mantenerse después de autenticar al usuario.

¿Por qué?

Porque un atacante podría fijar previamente el ID de sesión.

¿Cómo lo solucionamos?

req.session.regenerate()

Resultado

El identificador cambia después del login.