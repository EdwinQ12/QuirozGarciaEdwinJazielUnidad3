// routes/public.js
//
// Páginas de acceso libre (no requieren sesión).
const express = require("express");
const router = express.Router();

router.get("/nosotros", (req, res) => {
    res.render("nosotros", { titulo: "Nosotros" });
});

router.get("/servicios", (req, res) => {
    res.render("servicios", { titulo: "Servicios" });
});

router.get("/especialistas", (req, res) => {
    res.render("especialistas", { titulo: "Especialistas" });
});

router.get("/contacto", (req, res) => {
    res.render("contacto", { titulo: "Contacto" });
});

router.get("/ayuda", (req, res) => {
    res.render("ayuda", { titulo: "Ayuda" });
});

router.get("/mapa-sitio", (req, res) => {
    res.render("mapa-sitio", { titulo: "Mapa del Sitio" });
});

router.get("/rincon", (req, res) => {
    res.render("rincon", { titulo: "Rincón de Rayito" });
});

// Búsqueda sencilla: redirige al usuario a la página que escribió.
router.get("/buscar", (req, res) => {
    const busqueda = String(req.query.q || "").trim().toLowerCase();

    const paginas = {
        inicio: "/",
        nosotros: "/nosotros",
        servicios: "/servicios",
        especialistas: "/especialistas",
        contacto: "/contacto",
        ayuda: "/ayuda",
        registro: "/registro",
        login: "/login",
        recuperar: "/recuperar",
        mapa: "/mapa-sitio"
    };

    if (paginas[busqueda]) {
        return res.redirect(paginas[busqueda]);
    }

    res.status(404).render("404", { titulo: "Resultado no encontrado" });
});

module.exports = router;

// Nota: el buzón y la recuperación de contraseña viven en las rutas
// privadas (routes/dashboard.js) y en routes/auth.js respectivamente.
// Antes había copias duplicadas aquí que nunca se ejecutaban.
