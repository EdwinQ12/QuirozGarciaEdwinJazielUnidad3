// routes/middleware.js

// Middleware para proteger rutas: exige sesión iniciada.
function protegerRuta(req, res, next) {
    if (!req.session || !req.session.usuario) {
        req.session.mensaje = {
            tipo: "warning",
            texto: "Debes iniciar sesión para acceder"
        };

        return res.redirect("/login");
    }

    next();
}

// Middleware para limitar el acceso según el rol del usuario.
// Uso: protegerRol("medico", "administrador")
function protegerRol(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.usuario) {
            req.session.mensaje = {
                tipo: "warning",
                texto: "Debes iniciar sesión para acceder"
            };

            return res.redirect("/login");
        }

        if (!roles.includes(req.session.rol)) {
            req.session.mensaje = {
                tipo: "error",
                texto: "No tienes permiso para entrar a esa sección"
            };

            return res.redirect("/dashboard");
        }

        next();
    };
}

module.exports = { protegerRuta, protegerRol };
