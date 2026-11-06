// middleware/rateLimit.js
//
// Limita el número de peticiones para frenar ataques de fuerza bruta
// (probar contraseñas) y el abuso de los formularios públicos.
const { rateLimit } = require("express-rate-limit");

function crearLimitador({ windowMs, limite, texto, saltarExitosos = false }) {
    return rateLimit({
        windowMs,
        limit: limite,
        standardHeaders: true,
        legacyHeaders: false,
        // Si es true, las respuestas correctas (status < 400) no cuentan.
        skipSuccessfulRequests: saltarExitosos,
        // Cuando se supera el límite se responde con un 429 real y una
        // página clara (antes el redirect ocultaba el código de estado).
        handler: (req, res) => {
            return res.status(429).render("error", {
                titulo: "Demasiados intentos",
                codigo: 429,
                detalle: texto
            });
        }
    });
}

// 10 intentos fallidos de login cada 15 minutos por IP.
// Los inicios de sesión correctos NO cuentan: el login falla con 401
// y `skipSuccessfulRequests` descarta las respuestas 2xx/3xx.
const limiteLogin = crearLimitador({
    windowMs: 15 * 60 * 1000,
    limite: 10,
    saltarExitosos: true,
    texto: "Demasiados intentos fallidos de inicio de sesión. Espera 15 minutos e inténtalo de nuevo."
});

// 20 registros por hora por IP.
const limiteRegistro = crearLimitador({
    windowMs: 60 * 60 * 1000,
    limite: 20,
    texto: "Se alcanzó el límite de registros desde esta conexión. Inténtalo más tarde."
});

// 5 solicitudes de recuperación por hora por IP.
const limiteRecuperacion = crearLimitador({
    windowMs: 60 * 60 * 1000,
    limite: 5,
    texto: "Demasiadas solicitudes de recuperación. Inténtalo más tarde."
});

module.exports = { limiteLogin, limiteRegistro, limiteRecuperacion };
