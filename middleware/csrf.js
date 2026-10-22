// middleware/csrf.js
//
// Protección contra CSRF (Cross-Site Request Forgery) con el patrón de
// "token sincronizado": se guarda un token aleatorio en la sesión y se
// valida en cada petición que modifica estado (POST, PUT, PATCH, DELETE).
//
// No depende de librerías externas, así que funciona con cualquier
// versión de Express.
const crypto = require("crypto");

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

function generarToken(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }
    return req.session.csrfToken;
}

// Deja el token disponible en todas las vistas como `csrfToken`.
function exponerToken(req, res, next) {
    res.locals.csrfToken = generarToken(req);
    next();
}

// Comparación en tiempo constante para no filtrar información.
function compararSeguro(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
}

// Rechaza las peticiones que no traigan un token válido.
function validarToken(req, res, next) {
    if (METODOS_SEGUROS.has(req.method)) {
        return next();
    }

    const tokenEnviado = (req.body && req.body._csrf) || req.get("x-csrf-token");
    const tokenSesion = req.session && req.session.csrfToken;

    if (!compararSeguro(tokenEnviado, tokenSesion)) {
        return res.status(403).render("error", {
            titulo: "Solicitud rechazada",
            codigo: 403,
            detalle: "Tu sesión expiró o el formulario no es válido. Vuelve a intentarlo."
        });
    }

    next();
}

module.exports = { exponerToken, validarToken, generarToken };
