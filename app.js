require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const conexion = require("./database/conexion");

const app = express();

// Importar rutas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/public');

const PUERTO = 3000;
//importar bcrypt para hashing de contraseñas seguras
const bcrypt = require("bcrypt");


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configuración de sesiones
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
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


//comandos para usar las rutas importadas
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', publicRoutes);

// Manejo de errores 404
app.use((req, res) => {

    res.status(404).render('404', {
        titulo: 'Página no encontrada'
    });

});


app.listen(PUERTO, () => {
    console.log(`Servidor funcionando en http://localhost:${PUERTO}`);
});      