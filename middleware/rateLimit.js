// middleware/rateLimit.js
//
// Limita el número de peticiones para frenar ataques de fuerza bruta
// (probar contraseñas) y el abuso de los formularios públicos.
const { rateLimit } = require("express-rate-limit");

function crearLimitador({ windowMs, limite, texto, redirigir = "/" }) {
    return rateLimit({
        windowMs,
        limit: limite,
        standardHeaders: true,
        legacyHeaders: false,
        // Cuando se supera el límite, se avisa al usuario y se le redirige.
        handler: (req, res) => {
            if (req.session) {
                req.session.mensaje = { tipo: "warning", texto };
            }
            res.status(429).redirect(redirigir);
        }
    });
}

// 10 intentos de login cada 15 minutos por IP.
const limiteLogin = crearLimitador({
    windowMs: 15 * 60 * 1000,
    limite: 10,
    texto: "Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo de nuevo.",
    redirigir: "/login"
});

// 20 registros por hora por IP.
const limiteRegistro = crearLimitador({
    windowMs: 60 * 60 * 1000,
    limite: 20,
    texto: "Se alcanzó el límite de registros desde esta conexión. Inténtalo más tarde.",
    redirigir: "/registro"
});

// 5 solicitudes de recuperación por hora por IP.
const limiteRecuperacion = crearLimitador({
    windowMs: 60 * 60 * 1000,
    limite: 5,
    texto: "Demasiadas solicitudes de recuperación. Inténtalo más tarde.",
    redirigir: "/recuperar"
});

module.exports = { limiteLogin, limiteRegistro, limiteRecuperacion };
