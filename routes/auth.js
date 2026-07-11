//routes/auth.js
const express = require('express');
const router = express.Router();
const conexion = require('../database/conexion');
const bcrypt = require('bcrypt');
const axios = require('axios');
const Usuario = require('../models/Usuario');
//const { protegerRuta } = require('./middleware');

router.get('/', (req, res) => {
    res.render('index');
});

//aqui se hace el login del usuario, se compara la contraseña ingresada con la contraseña encriptada en la base de datos usando bcrypt.compare
router.post('/login', async (req, res) => {
const correo = req.body.correo;
const password = req.body.password;

    try {
        const resultado = await conexion.query(
            `SELECT * FROM usuarios WHERE correo = $1`,
            [correo]
        );

        if (resultado.rows.length === 0) {
            req.session.mensaje = { tipo: 'error', texto: 'Usuario o contraseña incorrectos' };
            return res.redirect('/login');
        }

        const usuario = resultado.rows[0];
        const acceso = await bcrypt.compare(password,usuario.password);

        if (acceso) {
            // Regenerar la sesión para evitar ataques de fijación de sesión
            req.session.regenerate((err) => {
                // Manejar el error si ocurre durante la regeneración de la sesión
                if (err) {
                    console.error('Error al regenerar la sesión:', err);
                    req.session.mensaje = { tipo: 'error', texto: 'Error al iniciar sesion' };
                    return res.redirect('/login');
                }
// Guardar información del usuario en la sesión
                req.session.usuario = usuario.correo;
                req.session.nombre = usuario.nombre;
                req.session.correo = usuario.correo;

                req.session.mensaje = { tipo: 'success', texto: 'Bienvenido ' + usuario.nombre };
                return res.redirect('/dashboard');
            });
        } else {
            req.session.mensaje = { tipo: 'error', texto: 'Contraseña o correo incorrectos' };
            return res.redirect('/login');
        }
    } catch (error) {
        console.log(error);
        req.session.mensaje = { tipo: 'error', texto: 'Error en el login' };
        res.redirect('/login');
    }
});

router.get('/login', (req, res) => {
    res.render('login');
});


router.get('/registro', (req, res) => {
    
    res.render('registro', {
        siteKey: process.env.RECAPTCHA_SITE_KEY,
    });
});

//en esta parte se hace el registro del usuario, se encripta la contraseña con bcrypt y se guarda en la base de datos
router.post('/registro', async (req, res) => {
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const password = req.body.password;
    const usuario = new Usuario(
        nombre,
        correo,
        password
    );

    // Verificar captcha
    const captcha= req.body['g-recaptcha-response'];
    if (!captcha) {

        req.session.mensaje = { tipo: 'error', texto: 'Por favor, completa el captcha' };
        return res.redirect('/registro');
    }

// Verificar la respuesta del captcha con Google
    const verificarCaptcha = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`, 
        null, 
        {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captcha
            }
        }
    );
    if (!verificarCaptcha.data.success) {
        req.session.mensaje = { tipo: 'error', texto: 'Captcha inválido' };
        return res.redirect('/registro');
    }

    //cifrar la contraseña con bcrypt antes de guardarla en la BD
    try {
        const hash = await bcrypt.hash(password, 10);

        console.log('Correo:', correo);
        console.log('Hash bcrypt:', hash);

        await conexion.query(
            `INSERT INTO usuarios (nombre, correo, password) VALUES ($1, $2, $3)`,
            [usuario.nombre, usuario.correo, hash]
        );
        req.session.mensaje = { tipo: 'success', texto: 'Registro exitoso, bienvenido ' + usuario.nombre };
        res.redirect('/login');
    } catch (error) {
        console.log('Error al registrar el Usuario', error);
        if (error && error.code === '23505') {
            req.session.mensaje = { tipo: 'error', texto: 'El correo ya está registrado' };
            return res.redirect('/registro');
        }
        req.session.mensaje = { tipo: 'error', texto: 'Error en el registro' };
        res.redirect('/registro');
    }
});

router.get('/recuperar', (req, res) => {
    res.render('recuperar',{
        titulo: 'Recuperar contraseña'
    });
});

//ruta para enviar el correo de recuperación de contraseña, se verifica que el correo exista en la base de datos y se redirige a la página de nueva contraseña
router.post('/recuperar', async (req, res) => {
    const correo = req.body.correo;
    console.log("correo recibido:", correo);


    try {
        const resultado = await conexion.query(
            `SELECT * FROM usuarios WHERE correo = $1`,
            [correo]
        );

        console.log("Resultado de la consulta:", resultado.rows);
        if (resultado.rows.length === 0) {
            req.session.mensaje = { tipo: 'error', texto: 'Usuario no encontrado' };
            return res.redirect('/recuperar');
        }
        res.render('nueva-password', { titulo: 'Nueva contraseña', correo });
    } catch (error) {
        console.log(error);
        req.session.mensaje = { tipo: 'error', texto: 'Error al verificar el correo' };
        res.redirect('/recuperar');
    }
});

//ruta para actualizar la contraseña, se encripta la nueva contraseña con bcrypt antes de guardarla en la base de datos
router.post('/nueva-password', async (req, res) => {
    const correo = req.body.correo;
    const password = req.body.password;

    try {
        const hash = await bcrypt.hash(password, 10);

        await conexion.query(
            `UPDATE usuarios SET password = $1 WHERE correo = $2`,
            [hash, correo]
        );

        req.session.mensaje = { tipo: 'success', texto: 'Contraseña actualizada correctamente' };
        res.redirect('/login');
    } catch (error) {
        console.log(error);
        req.session.mensaje = { tipo: 'error', texto: 'Error al actualizar la contraseña' };
        res.redirect('/recuperar');
    }
});

module.exports = router;
