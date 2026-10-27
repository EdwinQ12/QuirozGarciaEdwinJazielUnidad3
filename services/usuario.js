// services/usuario.js
//
// Devuelve el id del usuario que tiene la sesión abierta.
// Se guarda en la sesión la primera vez para no consultar la base
// en cada petición.
const conexion = require("../database/conexion");

async function idUsuario(req) {
    if (req.session && req.session.usuarioId) {
        return req.session.usuarioId;
    }

    const correo = String(
        (req.session && (req.session.correo || req.session.usuario)) || ""
    ).toLowerCase();

    if (!correo) return null;

    const resultado = await conexion.query(
        "SELECT id FROM usuarios WHERE LOWER(correo) = $1",
        [correo]
    );

    if (resultado.rows.length === 0) return null;

    req.session.usuarioId = resultado.rows[0].id;
    return req.session.usuarioId;
}

module.exports = { idUsuario };
