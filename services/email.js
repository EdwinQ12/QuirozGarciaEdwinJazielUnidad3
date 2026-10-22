// services/email.js
//
// Envío de correos del sistema.
//
// Si no hay un servidor SMTP configurado (caso típico en el entorno de la
// clase), el enlace de recuperación NO se envía: se imprime en la consola
// para poder probar el flujo. En producción se configuran las variables
// SMTP_* del archivo .env y el correo se envía de verdad.
const nodemailer = require("nodemailer");

const smtpConfigurado = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

const transporter = smtpConfigurado
    ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
          }
      })
    : null;

async function enviarCorreoRecuperacion({ para, enlace }) {
    // Sin SMTP: solo se registra en consola (únicamente fuera de producción).
    if (!transporter) {
        if (process.env.NODE_ENV !== "production") {
            console.warn("\n[email] SMTP no configurado.");
            console.warn(`[email] Enlace de recuperación para ${para}:\n${enlace}\n`);
        }
        return { enviado: false };
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: para,
        subject: "Restablecer contraseña - Un Rayito de Sol",
        text:
            "Recibimos una solicitud para restablecer tu contraseña.\n\n" +
            `Abre este enlace (válido durante 1 hora):\n${enlace}\n\n` +
            "Si tú no lo solicitaste, ignora este mensaje.",
        html:
            "<p>Recibimos una solicitud para restablecer tu contraseña.</p>" +
            `<p><a href="${enlace}">Restablecer mi contraseña</a> (válido durante 1 hora)</p>` +
            "<p>Si tú no lo solicitaste, ignora este mensaje.</p>"
    });

    return { enviado: true };
}

module.exports = { enviarCorreoRecuperacion, smtpConfigurado };
