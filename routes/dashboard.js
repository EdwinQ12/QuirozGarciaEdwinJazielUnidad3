// routes/dashboard.js
const express = require("express");
const router = express.Router();

const conexion = require("../database/conexion");
const { protegerRuta } = require("./middleware");
const { idUsuario } = require("../services/usuario");
const { EMOCIONES, MAPA } = require("../services/emociones");

const NOMBRE_COOKIE = "rayito.sid";

/* =========================================================
   Panel principal (cambia según el rol)
   ========================================================= */
router.get("/dashboard", protegerRuta, async (req, res) => {
    const rol = req.session.rol || "paciente";
    const datos = {
        nombre: req.session.nombre,
        correo: req.session.correo,
        rol: rol
    };

    try {
        if (rol === "administrador") {
            return res.render("admin/dashboard", {
                ...datos,
                stats: (await conexion.query(
                    `SELECT (SELECT COUNT(*) FROM usuarios)::int                            AS usuarios,
                            (SELECT COUNT(*) FROM citas)::int                               AS citas,
                            (SELECT COUNT(*) FROM citas WHERE estado = 'pendiente')::int    AS pendientes,
                            (SELECT COUNT(*) FROM citas WHERE fecha = CURRENT_DATE)::int    AS hoy,
                            (SELECT COUNT(*) FROM buzon)::int                               AS mensajes`
                )).rows[0],
                citas: (await conexion.query(
                    `SELECT c.id,
                            u.nombre AS paciente,
                            TO_CHAR(c.fecha, 'DD/MM/YYYY') AS fecha,
                            TO_CHAR(c.hora, 'HH24:MI')     AS hora,
                            c.estado,
                            e.nombre AS especialista
                       FROM citas c
                       JOIN usuarios u      ON u.id = c.usuario_id
                       JOIN especialistas e ON e.id = c.especialista_id
                      ORDER BY c.fecha DESC, c.hora DESC
                      LIMIT 12`
                )).rows
            });
        }

        if (rol === "medico") {
            return res.render("medico/dashboard", {
                ...datos,
                citas: (await conexion.query(
                    `SELECT c.id,
                            u.nombre AS paciente,
                            TO_CHAR(c.fecha, 'DD/MM/YYYY') AS fecha,
                            TO_CHAR(c.hora, 'HH24:MI')     AS hora,
                            c.motivo,
                            c.estado,
                            e.nombre AS especialista
                       FROM citas c
                       JOIN usuarios u      ON u.id = c.usuario_id
                       JOIN especialistas e ON e.id = c.especialista_id
                      WHERE c.estado IN ('pendiente', 'confirmada')
                      ORDER BY c.fecha, c.hora
                      LIMIT 40`
                )).rows
            });
        }

        // ---------------- Paciente ----------------
        const usuarioId = await idUsuario(req);

        const [proxima, resumen, emocionHoy, historial] = await Promise.all([
            conexion.query(
                `SELECT TO_CHAR(c.fecha, 'DD/MM/YYYY') AS fecha,
                        TO_CHAR(c.hora, 'HH24:MI')     AS hora,
                        c.estado,
                        e.nombre       AS especialista,
                        e.especialidad
                   FROM citas c
                   JOIN especialistas e ON e.id = c.especialista_id
                  WHERE c.usuario_id = $1
                    AND c.estado IN ('pendiente', 'confirmada')
                    AND c.fecha >= CURRENT_DATE
                  ORDER BY c.fecha, c.hora
                  LIMIT 1`,
                [usuarioId]
            ),
            conexion.query(
                `SELECT (SELECT COUNT(*) FROM citas WHERE usuario_id = $1)::int                       AS citas,
                        (SELECT COUNT(*) FROM citas WHERE usuario_id = $1 AND estado = 'atendida')::int AS atendidas,
                        (SELECT COUNT(*) FROM diario_emociones WHERE usuario_id = $1)::int             AS dias`,
                [usuarioId]
            ),
            conexion.query(
                `SELECT emocion, nota
                   FROM diario_emociones
                  WHERE usuario_id = $1 AND fecha = CURRENT_DATE`,
                [usuarioId]
            ),
            conexion.query(
                `SELECT emocion, TO_CHAR(fecha, 'DD/MM') AS fecha
                   FROM diario_emociones
                  WHERE usuario_id = $1
                  ORDER BY fecha DESC
                  LIMIT 7`,
                [usuarioId]
            )
        ]);

        res.render("dashboard", {
            ...datos,
            proxima: proxima.rows[0] || null,
            resumen: resumen.rows[0],
            emocionHoy: emocionHoy.rows[0] || null,
            historial: historial.rows,
            mapaEmociones: MAPA
        });
    } catch (error) {
        console.error("Error al cargar el panel:", error);
        req.session.mensaje = { tipo: "error", texto: "No se pudo cargar el panel" };
        res.render("error", {
            titulo: "Error",
            codigo: 500,
            detalle: "No se pudo cargar el panel. Revisa la conexión a la base de datos."
        });
    }
});

/* =========================================================
   Buzón de sugerencias (área privada)
   ========================================================= */
router.get("/buzon", protegerRuta, (req, res) => {
    res.render("buzon", {
        titulo: "Buzón",
        nombre: req.session.nombre
    });
});

router.post("/buzon", protegerRuta, async (req, res) => {
    const asunto = String(req.body.asunto || "").trim();
    const mensaje = String(req.body.mensaje || "").trim();

    if (!asunto || !mensaje) {
        req.session.mensaje = { tipo: "warning", texto: "Escribe un asunto y un mensaje" };
        return res.redirect("/buzon");
    }

    try {
        await conexion.query(
            `INSERT INTO buzon (nombre, asunto, mensaje) VALUES ($1, $2, $3)`,
            [req.session.nombre, asunto, mensaje]
        );
        req.session.mensaje = { tipo: "success", texto: "Mensaje enviado correctamente" };
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        req.session.mensaje = { tipo: "error", texto: "Error al enviar mensaje" };
    }

    res.redirect("/buzon");
});

/* =========================================================
   Chat de comentarios (área privada)
   ========================================================= */
router.get("/chat", protegerRuta, async (req, res) => {
    try {
        const mensajes = await conexion.query(`SELECT * FROM chat ORDER BY fecha ASC`);

        res.render("chat", {
            titulo: "Chat",
            nombre: req.session.nombre,
            mensajes: mensajes.rows
        });
    } catch (error) {
        console.error("Error al cargar el chat:", error);
        res.status(500).send("Error al cargar el chat");
    }
});

router.post("/chat", protegerRuta, async (req, res) => {
    const mensaje = String(req.body.mensaje || "").trim();

    if (!mensaje) {
        return res.redirect("/chat");
    }

    try {
        await conexion.query(
            `INSERT INTO chat (usuario, mensaje, fecha) VALUES ($1, $2, NOW())`,
            [req.session.nombre, mensaje]
        );
        res.redirect("/chat");
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        res.status(500).send("Error al enviar mensaje");
    }
});

/* =========================================================
   Cerrar sesión
   ========================================================= */
router.get("/logout", protegerRuta, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).send("Error al cerrar sesión");
        }
        res.clearCookie(NOMBRE_COOKIE);
        res.redirect("/");
    });
});

module.exports = router;
