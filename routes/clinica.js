// routes/clinica.js
//
// Funciones del consultorio en línea para los usuarios con sesión:
//   - Citas (agendar, ver historial, cancelar).
//   - Diario de emociones.
//   - Perfil (datos de contacto y contraseña).
//   - Cambio de estado de las citas (solo médico y administrador).
const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();
const conexion = require("../database/conexion");
const { protegerRuta, protegerRol } = require("./middleware");
const { idUsuario } = require("../services/usuario");
const { EMOCIONES } = require("../services/emociones");

const HORARIOS = ["09:00", "10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00"];
const MIN_PASSWORD = 8;

function esFecha(valor) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(valor)) && !Number.isNaN(Date.parse(valor));
}

/* =========================================================
   CITAS
   ========================================================= */

// Ver las citas propias y el formulario para agendar.
router.get("/citas", protegerRuta, async (req, res) => {
    try {
        const usuarioId = await idUsuario(req);
        if (!usuarioId) return res.redirect("/login");

        const [citas, especialistas, hoy] = await Promise.all([
            conexion.query(
                `SELECT c.id,
                        TO_CHAR(c.fecha, 'DD/MM/YYYY') AS fecha,
                        TO_CHAR(c.hora, 'HH24:MI')    AS hora,
                        c.motivo,
                        c.estado,
                        e.nombre       AS especialista,
                        e.especialidad
                   FROM citas c
                   JOIN especialistas e ON e.id = c.especialista_id
                  WHERE c.usuario_id = $1
                  ORDER BY c.fecha DESC, c.hora DESC`,
                [usuarioId]
            ),
            conexion.query(
                `SELECT id, nombre, especialidad, descripcion
                   FROM especialistas
                  WHERE activo = true
                  ORDER BY nombre`
            ),
            conexion.query("SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS hoy")
        ]);

        res.render("citas", {
            titulo: "Mis citas",
            citas: citas.rows,
            especialistas: especialistas.rows,
            horarios: HORARIOS,
            hoy: hoy.rows[0].hoy
        });
    } catch (error) {
        console.error("Error al cargar las citas:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudieron cargar las citas" };
        res.redirect("/dashboard");
    }
});

// Agendar una cita.
router.post("/citas", protegerRuta, async (req, res) => {
    const especialistaId = Number(req.body.especialista_id);
    const fecha = String(req.body.fecha || "");
    const hora = String(req.body.hora || "");
    const motivo = String(req.body.motivo || "").trim();

    function error(texto) {
        req.session.mensaje = { tipo: "error", texto };
        return res.redirect("/citas");
    }

    if (!Number.isInteger(especialistaId) || especialistaId <= 0) {
        return error("Elige un especialista");
    }
    if (!esFecha(fecha)) {
        return error("Elige una fecha válida");
    }
    if (!HORARIOS.includes(hora)) {
        return error("Elige un horario válido");
    }
    if (motivo.length < 5) {
        return error("Describe el motivo de la consulta (mínimo 5 caracteres)");
    }
    if (motivo.length > 600) {
        return error("El motivo es demasiado largo");
    }

    try {
        const usuarioId = await idUsuario(req);
        if (!usuarioId) return res.redirect("/login");

        // La fecha se valida contra el reloj de la base de datos.
        const rango = await conexion.query(
            `SELECT $1::date >= CURRENT_DATE
                    AND $1::date <= (CURRENT_DATE + INTERVAL '6 months') AS valida`,
            [fecha]
        );

        if (!rango.rows[0].valida) {
            return error("La fecha debe ser de hoy en adelante (máximo 6 meses)");
        }

        const especialista = await conexion.query(
            "SELECT id FROM especialistas WHERE id = $1 AND activo = true",
            [especialistaId]
        );

        if (especialista.rows.length === 0) {
            return error("El especialista no está disponible");
        }

        await conexion.query(
            `INSERT INTO citas (usuario_id, especialista_id, fecha, hora, motivo)
             VALUES ($1, $2, $3, $4, $5)`,
            [usuarioId, especialistaId, fecha, hora, motivo]
        );

        req.session.mensaje = { tipo: "success", texto: "Cita agendada correctamente" };
        res.redirect("/citas");
    } catch (error) {
        if (error && error.code === "23505") {
            req.session.mensaje = {
                tipo: "warning",
                texto: "Ese horario ya está ocupado. Elige otro."
            };
            return res.redirect("/citas");
        }

        console.error("Error al agendar la cita:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo agendar la cita" };
        res.redirect("/citas");
    }
});

// Cancelar una cita propia.
router.post("/citas/:id/cancelar", protegerRuta, async (req, res) => {
    const id = Number(req.params.id);

    try {
        const usuarioId = await idUsuario(req);

        const resultado = await conexion.query(
            `UPDATE citas
                SET estado = 'cancelada'
              WHERE id = $1 AND usuario_id = $2
                AND estado IN ('pendiente', 'confirmada')
              RETURNING id`,
            [id, usuarioId]
        );

        req.session.mensaje = resultado.rowCount > 0
            ? { tipo: "success", texto: "Cita cancelada" }
            : { tipo: "warning", texto: "La cita no existe o ya no se puede cancelar" };
    } catch (error) {
        console.error("Error al cancelar la cita:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo cancelar la cita" };
    }

    res.redirect("/citas");
});

// Cambiar el estado de una cita (médico y administrador).
router.post("/citas/:id/estado", protegerRol("medico", "administrador"), async (req, res) => {
    const id = Number(req.params.id);
    const estado = String(req.body.estado || "");
    const permitidos = ["confirmada", "atendida", "cancelada"];

    if (!permitidos.includes(estado)) {
        req.session.mensaje = { tipo: "error", texto: "Estado no válido" };
        return res.redirect("/dashboard");
    }

    try {
        const resultado = await conexion.query(
            "UPDATE citas SET estado = $1 WHERE id = $2 RETURNING id",
            [estado, id]
        );

        req.session.mensaje = resultado.rowCount > 0
            ? { tipo: "success", texto: "Cita marcada como " + estado }
            : { tipo: "warning", texto: "La cita no existe" };
    } catch (error) {
        console.error("Error al cambiar el estado de la cita:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo actualizar la cita" };
    }

    res.redirect("/dashboard");
});

/* =========================================================
   DIARIO DE EMOCIONES
   ========================================================= */

router.get("/diario", protegerRuta, async (req, res) => {
    try {
        const usuarioId = await idUsuario(req);
        if (!usuarioId) return res.redirect("/login");

        const [entradas, hoy, resumen] = await Promise.all([
            conexion.query(
                `SELECT emocion, nota, TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha
                   FROM diario_emociones
                  WHERE usuario_id = $1
                  ORDER BY fecha DESC
                  LIMIT 60`,
                [usuarioId]
            ),
            conexion.query(
                `SELECT emocion, nota
                   FROM diario_emociones
                  WHERE usuario_id = $1 AND fecha = CURRENT_DATE`,
                [usuarioId]
            ),
            conexion.query(
                `SELECT emocion, COUNT(*)::int AS total
                   FROM diario_emociones
                  WHERE usuario_id = $1
                    AND fecha >= (CURRENT_DATE - INTERVAL '30 days')
                  GROUP BY emocion`,
                [usuarioId]
            )
        ]);

        res.render("diario", {
            titulo: "Mi diario de emociones",
            emociones: EMOCIONES,
            entradas: entradas.rows,
            hoy: hoy.rows[0] || null,
            resumen: resumen.rows
        });
    } catch (error) {
        console.error("Error al cargar el diario:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo cargar el diario" };
        res.redirect("/dashboard");
    }
});

router.post("/diario", protegerRuta, async (req, res) => {
    const emocion = String(req.body.emocion || "");
    const nota = String(req.body.nota || "").trim().slice(0, 500);

    const valida = EMOCIONES.some((item) => item.clave === emocion);

    if (!valida) {
        req.session.mensaje = { tipo: "error", texto: "Elige cómo te sientes" };
        return res.redirect("/diario");
    }

    try {
        const usuarioId = await idUsuario(req);
        if (!usuarioId) return res.redirect("/login");

        await conexion.query(
            `INSERT INTO diario_emociones (usuario_id, emocion, nota)
             VALUES ($1, $2, $3)
             ON CONFLICT (usuario_id, fecha)
             DO UPDATE SET emocion   = EXCLUDED.emocion,
                           nota      = EXCLUDED.nota,
                           creado_en = NOW()`,
            [usuarioId, emocion, nota || null]
        );

        req.session.mensaje = {
            tipo: "success",
            texto: "¡Registrado! Gracias por compartir cómo te sientes."
        };
        res.redirect("/diario");
    } catch (error) {
        console.error("Error al guardar la emoción:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo guardar" };
        res.redirect("/diario");
    }
});

/* =========================================================
   PERFIL
   ========================================================= */

router.get("/perfil", protegerRuta, async (req, res) => {
    try {
        const usuarioId = await idUsuario(req);
        if (!usuarioId) return res.redirect("/login");

        const resultado = await conexion.query(
            `SELECT nombre,
                    correo,
                    COALESCE(telefono, '')                  AS telefono,
                    TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
                    TO_CHAR(creado_en, 'DD/MM/YYYY')        AS creado
               FROM usuarios
              WHERE id = $1`,
            [usuarioId]
        );

        if (resultado.rows.length === 0) return res.redirect("/logout");

        res.render("perfil", {
            titulo: "Mi perfil",
            datos: resultado.rows[0]
        });
    } catch (error) {
        console.error("Error al cargar el perfil:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo cargar el perfil" };
        res.redirect("/dashboard");
    }
});

router.post("/perfil", protegerRuta, async (req, res) => {
    const nombre = String(req.body.nombre || "").trim();
    const telefono = String(req.body.telefono || "").trim().slice(0, 30);
    const nacimiento = String(req.body.fecha_nacimiento || "").trim();

    function error(texto) {
        req.session.mensaje = { tipo: "error", texto };
        return res.redirect("/perfil");
    }

    if (nombre.length < 3) return error("Escribe tu nombre completo");
    if (nombre.length > 120) return error("El nombre es demasiado largo");
    if (nacimiento && !esFecha(nacimiento)) return error("La fecha de nacimiento no es válida");

    try {
        const usuarioId = await idUsuario(req);

        await conexion.query(
            `UPDATE usuarios
                SET nombre = $1, telefono = $2, fecha_nacimiento = $3
              WHERE id = $4`,
            [nombre, telefono || null, nacimiento || null, usuarioId]
        );

        req.session.nombre = nombre;
        req.session.mensaje = { tipo: "success", texto: "Datos actualizados" };
        res.redirect("/perfil");
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo actualizar el perfil" };
        res.redirect("/perfil");
    }
});

router.post("/perfil/password", protegerRuta, async (req, res) => {
    const actual = String(req.body.actual || "");
    const nueva = String(req.body.nueva || "");
    const repetir = String(req.body.repetir || "");

    function error(texto) {
        req.session.mensaje = { tipo: "error", texto };
        return res.redirect("/perfil");
    }

    if (nueva.length < MIN_PASSWORD) {
        return error(`La contraseña nueva debe tener al menos ${MIN_PASSWORD} caracteres`);
    }
    if (nueva !== repetir) return error("Las contraseñas nuevas no coinciden");
    if (nueva === actual) return error("La contraseña nueva debe ser diferente a la actual");

    try {
        const usuarioId = await idUsuario(req);

        const resultado = await conexion.query(
            "SELECT password FROM usuarios WHERE id = $1",
            [usuarioId]
        );

        if (resultado.rows.length === 0) return res.redirect("/logout");

        const coincide = await bcrypt.compare(actual, resultado.rows[0].password);
        if (!coincide) return error("La contraseña actual no es correcta");

        const hash = await bcrypt.hash(nueva, 10);

        await conexion.query(
            "UPDATE usuarios SET password = $1 WHERE id = $2",
            [hash, usuarioId]
        );

        req.session.mensaje = { tipo: "success", texto: "Contraseña actualizada" };
        res.redirect("/perfil");
    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo cambiar la contraseña" };
        res.redirect("/perfil");
    }
});

module.exports = router;
