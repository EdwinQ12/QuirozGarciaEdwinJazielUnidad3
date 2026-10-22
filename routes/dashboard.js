// routes/dashboard.js
const express = require("express");
const router = express.Router();
const conexion = require("../database/conexion");
const { protegerRuta } = require("./middleware");

const NOMBRE_COOKIE = "rayito.sid";

// Panel principal: muestra una vista distinta según el rol del usuario.
router.get("/dashboard", protegerRuta, (req, res) => {
    const datos = {
        nombre: req.session.nombre,
        correo: req.session.correo,
        rol: req.session.rol || "paciente"
    };

    if (datos.rol === "administrador") {
        return res.render("admin/dashboard", datos);
    }

    if (datos.rol === "medico") {
        return res.render("medico/dashboard", datos);
    }

    return res.render("dashboard", datos);
});

// ---------------- Buzón de sugerencias (área privada) ----------------
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

// ---------------- Chat de comentarios (área privada) ----------------
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

// ---------------- Cerrar sesión ----------------
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
