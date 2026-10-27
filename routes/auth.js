// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const axios = require("axios");

const router = express.Router();
const conexion = require("../database/conexion");
const Usuario = require("../models/Usuario");
const { enviarCorreoRecuperacion } = require("../services/email");
const {
    limiteLogin,
    limiteRegistro,
    limiteRecuperacion
} = require("../middleware/rateLimit");

const MIN_PASSWORD = 8;

// Los tokens se guardan como hash: si alguien lee la tabla, no puede usarlos.
function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

async function tokenValido(token) {
    if (!token) return false;

    const resultado = await conexion.query(
        `SELECT id FROM reset_tokens
         WHERE token_hash = $1 AND usado = false AND expira > NOW()`,
        [hashToken(token)]
    );

    return resultado.rows.length > 0;
}

// ---------------- Inicio ----------------
router.get("/", (req, res) => {
    res.render("index");
});

// ---------------- Login ----------------
router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", limiteLogin, async (req, res) => {
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    try {
        const resultado = await conexion.query(
            `SELECT * FROM usuarios WHERE LOWER(correo) = $1`,
            [correo]
        );

        if (resultado.rows.length === 0) {
            req.session.mensaje = { tipo: "error", texto: "Usuario o contraseña incorrectos" };
            return res.redirect("/login");
        }

        const usuario = resultado.rows[0];
        const acceso = await bcrypt.compare(password, usuario.password);

        if (!acceso) {
            req.session.mensaje = { tipo: "error", texto: "Usuario o contraseña incorrectos" };
            return res.redirect("/login");
        }

        // Regenerar la sesión evita ataques de fijación de sesión
        // (el atacante no puede reutilizar un id de sesión conocido).
        req.session.regenerate((err) => {
            if (err) {
                console.error("Error al regenerar la sesión:", err);
                req.session.mensaje = { tipo: "error", texto: "Error al iniciar sesión" };
                return res.redirect("/login");
            }

            req.session.usuario = usuario.correo;
            req.session.nombre = usuario.nombre;
            req.session.correo = usuario.correo;
            req.session.rol = usuario.rol || "paciente";
            req.session.usuarioId = usuario.id;
            req.session.mensaje = { tipo: "success", texto: "Bienvenido " + usuario.nombre };

            return res.redirect("/dashboard");
        });
    } catch (error) {
        console.error("Error en el login:", error);
        req.session.mensaje = { tipo: "error", texto: "Error en el login" };
        res.redirect("/login");
    }
});

// ---------------- Registro ----------------
router.get("/registro", (req, res) => {
    res.render("registro", { siteKey: process.env.RECAPTCHA_SITE_KEY });
});

router.post("/registro", limiteRegistro, async (req, res) => {
    const nombre = String(req.body.nombre || "").trim();
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const captcha = req.body["g-recaptcha-response"];

    // Validación en el servidor (la del navegador se puede saltar).
    if (nombre.length < 3 || !correo.includes("@") || password.length < MIN_PASSWORD) {
        req.session.mensaje = {
            tipo: "error",
            texto: `Revisa los datos: nombre completo, un correo válido y una contraseña de al menos ${MIN_PASSWORD} caracteres.`
        };
        return res.redirect("/registro");
    }

    if (!captcha) {
        req.session.mensaje = { tipo: "error", texto: "Por favor, completa el captcha" };
        return res.redirect("/registro");
    }

    try {
        // Verificar la respuesta del captcha con Google
        const verificarCaptcha = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: captcha
                }
            }
        );

        if (!verificarCaptcha.data.success) {
            req.session.mensaje = { tipo: "error", texto: "Captcha inválido" };
            return res.redirect("/registro");
        }

        const usuario = new Usuario(nombre, correo, password);
        const hash = await bcrypt.hash(usuario.password, 10);

        await conexion.query(
            `INSERT INTO usuarios (nombre, correo, password, rol) VALUES ($1, $2, $3, $4)`,
            [usuario.nombre, usuario.correo, hash, "paciente"]
        );

        req.session.mensaje = { tipo: "success", texto: "Registro exitoso, ya puedes iniciar sesión" };
        return res.redirect("/login");
    } catch (error) {
        console.error("Error al registrar el Usuario:", error);

        if (error && error.code === "23505") {
            req.session.mensaje = { tipo: "error", texto: "El correo ya está registrado" };
            return res.redirect("/registro");
        }

        req.session.mensaje = { tipo: "error", texto: "Error en el registro" };
        return res.redirect("/registro");
    }
});

// ---------------- Recuperación de contraseña ----------------
router.get("/recuperar", (req, res) => {
    res.render("recuperar", { titulo: "Recuperar contraseña" });
});

// Solicita el enlace de recuperación.
// Genera un token aleatorio de un solo uso y lo envía por correo.
router.post("/recuperar", limiteRecuperacion, async (req, res) => {
    const correo = String(req.body.correo || "").trim().toLowerCase();

    // Respuesta genérica: no revelamos si el correo existe (evita enumerar usuarios).
    const respuestaGenerica = {
        tipo: "success",
        texto: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
    };

    try {
        const resultado = await conexion.query(
            `SELECT id FROM usuarios WHERE LOWER(correo) = $1`,
            [correo]
        );

        if (resultado.rows.length > 0) {
            const token = crypto.randomBytes(32).toString("hex");
            const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            // Un solo token activo por correo.
            await conexion.query(`DELETE FROM reset_tokens WHERE correo = $1`, [correo]);
            await conexion.query(
                `INSERT INTO reset_tokens (correo, token_hash, expira) VALUES ($1, $2, $3)`,
                [correo, hashToken(token), expira]
            );

            const enlace = `${req.protocol}://${req.get("host")}/nueva-password?token=${token}`;
            await enviarCorreoRecuperacion({ para: correo, enlace });
        }

        req.session.mensaje = respuestaGenerica;
        return res.redirect("/login");
    } catch (error) {
        console.error("Error en /recuperar:", error);
        req.session.mensaje = { tipo: "error", texto: "Error al procesar la solicitud" };
        return res.redirect("/recuperar");
    }
});

// Formulario para escribir la nueva contraseña: exige un token válido.
router.get("/nueva-password", async (req, res) => {
    const token = String(req.query.token || "");

    try {
        if (!(await tokenValido(token))) {
            req.session.mensaje = { tipo: "error", texto: "El enlace no es válido o ya expiró" };
            return res.redirect("/recuperar");
        }

        res.render("nueva-password", { titulo: "Nueva contraseña", token });
    } catch (error) {
        console.error("Error al validar el token:", error);
        req.session.mensaje = { tipo: "error", texto: "Error al validar el enlace" };
        res.redirect("/recuperar");
    }
});

// Guarda la nueva contraseña (solo con token válido y sin usar).
router.post("/nueva-password", limiteRecuperacion, async (req, res) => {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");

    if (password.length < MIN_PASSWORD) {
        req.session.mensaje = {
            tipo: "error",
            texto: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`
        };
        return res.redirect(`/nueva-password?token=${encodeURIComponent(token)}`);
    }

    try {
        const resultado = await conexion.query(
            `SELECT correo FROM reset_tokens
             WHERE token_hash = $1 AND usado = false AND expira > NOW()`,
            [hashToken(token)]
        );

        if (resultado.rows.length === 0) {
            req.session.mensaje = { tipo: "error", texto: "El enlace no es válido o ya expiró" };
            return res.redirect("/recuperar");
        }

        const correo = resultado.rows[0].correo;
        const hash = await bcrypt.hash(password, 10);

        await conexion.query(
            `UPDATE usuarios SET password = $1 WHERE LOWER(correo) = $2`,
            [hash, correo]
        );
        // El token se marca como usado: no puede reutilizarse.
        await conexion.query(
            `UPDATE reset_tokens SET usado = true WHERE token_hash = $1`,
            [hashToken(token)]
        );

        req.session.mensaje = { tipo: "success", texto: "Contraseña actualizada correctamente" };
        return res.redirect("/login");
    } catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        req.session.mensaje = { tipo: "error", texto: "Error al actualizar la contraseña" };
        return res.redirect("/recuperar");
    }
});

module.exports = router;
