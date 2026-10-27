require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");

const conexion = require("./database/conexion");
const { exponerToken, validarToken } = require("./middleware/csrf");

// Importar rutas
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const clinicaRoutes = require("./routes/clinica");
const publicRoutes = require("./routes/public");

const app = express();
const PUERTO = Number(process.env.PORT) || 3000;

// Express debe confiar en el proxy inverso (ngrok) para conocer el
// protocolo (https) y la IP reales del cliente.
app.set("trust proxy", 1);

// Cabeceras de seguridad. La CSP permite los CDN que usa el front
// (Bootstrap, Font Awesome, SweetAlert2, Google Fonts y reCAPTCHA).
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://www.google.com",
                    "https://www.gstatic.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com"
                ],
                fontSrc: [
                    "'self'",
                    "data:",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.gstatic.com"
                ],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
                frameSrc: ["https://www.google.com"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"]
            }
        }
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

// Los archivos estáticos se sirven antes de la sesión para no crear
// una sesión por cada imagen, hoja de estilo o script.
app.use(express.static(path.join(__dirname, "public")));

// Configuración de sesiones
if (!process.env.SESSION_SECRET) {
    console.warn("[aviso] SESSION_SECRET no está definido. Configúralo en tu archivo .env.");
}

app.use(
    session({
        name: "rayito.sid",
        secret: process.env.SESSION_SECRET || "cambia-este-secreto-en-produccion",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            // "auto": cookie segura en https (ngrok/producción) y normal en http local.
            secure: "auto",
            maxAge: 2 * 60 * 60 * 1000
        }
    })
);

// Middleware para hacer mensajes flash disponibles en las vistas
app.use((req, res, next) => {
    res.locals.mensaje = req.session.mensaje || null;
    delete req.session.mensaje;
    next();
});

// Middleware para hacer variables de sesión disponibles en las vistas
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario;
    res.locals.nombre = req.session.nombre;
    res.locals.rol = req.session.rol;
    next();
});

// Protección CSRF. Va después de la sesión (necesita el token guardado)
// y del parseo del cuerpo (necesita leer el campo _csrf).
app.use(exponerToken);
app.use(validarToken);

// Rutas
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", clinicaRoutes);
app.use("/", publicRoutes);

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).render("404", { titulo: "Página no encontrada" });
});

// Manejador de errores no controlados
app.use((err, req, res, next) => {
    console.error("Error no controlado:", err);
    res.status(500).render("error", {
        titulo: "Error interno",
        codigo: 500,
        detalle: "Ocurrió un error inesperado. Inténtalo más tarde."
    });
});

app.listen(PUERTO, () => {
    console.log(`Servidor funcionando en http://localhost:${PUERTO}`);
});
