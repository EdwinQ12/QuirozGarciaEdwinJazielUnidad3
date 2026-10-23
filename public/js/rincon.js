// public/js/rincon.js
//
// Juegos del "Rincón de Rayito":
//   1. Memorama de emociones.
//   2. ¿Cómo me siento hoy?
//   3. Respira conmigo.
(function () {
    "use strict";

    /* =========================================================
       1. Memorama de emociones
       ========================================================= */
    const EMOCIONES = [
        { emoji: "😀", nombre: "Feliz" },
        { emoji: "😢", nombre: "Triste" },
        { emoji: "😡", nombre: "Enojado" },
        { emoji: "😨", nombre: "Asustado" },
        { emoji: "😴", nombre: "Cansado" },
        { emoji: "🤗", nombre: "Querido" },
        { emoji: "😮", nombre: "Sorprendido" },
        { emoji: "🥰", nombre: "Orgulloso" }
    ];

    function crearMemorama() {
        const tablero = document.getElementById("memorama");
        if (!tablero) return;

        const intentosEl = document.getElementById("memorama-intentos");
        const paresEl = document.getElementById("memorama-pares");
        const mensajeEl = document.getElementById("memorama-mensaje");
        const reiniciarBtn = document.getElementById("memorama-reiniciar");

        let primera = null;
        let segunda = null;
        let bloqueado = false;
        let intentos = 0;
        let pares = 0;

        function actualizarMarcador() {
            if (intentosEl) intentosEl.textContent = String(intentos);
            if (paresEl) paresEl.textContent = `${pares} de ${EMOCIONES.length}`;
        }

        function mezclar(lista) {
            for (let i = lista.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temporal = lista[i];
                lista[i] = lista[j];
                lista[j] = temporal;
            }
            return lista;
        }

        function construir() {
            tablero.innerHTML = "";
            primera = null;
            segunda = null;
            bloqueado = false;
            intentos = 0;
            pares = 0;
            actualizarMarcador();
            if (mensajeEl) mensajeEl.textContent = "";

            const cartas = [];

            EMOCIONES.forEach((emocion, indice) => {
                cartas.push({ emoji: emocion.emoji, nombre: emocion.nombre, par: indice });
                cartas.push({ emoji: emocion.emoji, nombre: emocion.nombre, par: indice });
            });

            mezclar(cartas);

            cartas.forEach((carta, posicion) => {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "carta";
                boton.dataset.par = String(carta.par);
                boton.setAttribute("aria-label", `Carta ${posicion + 1}, oculta`);

                boton.innerHTML =
                    '<span class="carta-inner">' +
                    '<span class="carta-cara carta-frente" aria-hidden="true">?</span>' +
                    '<span class="carta-cara carta-reverso" aria-hidden="true">' +
                    carta.emoji +
                    `<small>${carta.nombre}</small>` +
                    "</span>" +
                    "</span>";

                boton.addEventListener("click", () => voltear(boton, carta));
                tablero.appendChild(boton);
            });
        }

        function voltear(boton, carta) {
            if (bloqueado) return;
            if (boton.classList.contains("volteada") || boton.classList.contains("encontrada")) return;

            boton.classList.add("volteada");
            boton.setAttribute("aria-label", `Carta descubierta: ${carta.nombre}`);

            if (!primera) {
                primera = { boton: boton, carta: carta };
                return;
            }

            segunda = { boton: boton, carta: carta };
            intentos++;
            actualizarMarcador();
            bloqueado = true;

            if (primera.carta.par === segunda.carta.par) {
                primera.boton.classList.add("encontrada");
                segunda.boton.classList.add("encontrada");
                pares++;
                actualizarMarcador();

                primera = null;
                segunda = null;
                bloqueado = false;

                if (pares === EMOCIONES.length) {
                    if (mensajeEl) {
                        mensajeEl.textContent =
                            `¡Excelente! Encontraste todos los pares en ${intentos} intentos 🎉`;
                    }
                    if (window.Rayito) window.Rayito.confeti(90);
                }
            } else {
                const a = primera;
                const b = segunda;

                setTimeout(() => {
                    a.boton.classList.remove("volteada");
                    b.boton.classList.remove("volteada");
                    a.boton.setAttribute("aria-label", "Carta oculta");
                    b.boton.setAttribute("aria-label", "Carta oculta");
                    primera = null;
                    segunda = null;
                    bloqueado = false;
                }, 850);
            }
        }

        if (reiniciarBtn) reiniciarBtn.addEventListener("click", construir);

        construir();
    }

    /* =========================================================
       2. ¿Cómo me siento hoy?
       ========================================================= */
    const RESPUESTAS = {
        feliz: {
            emoji: "😀",
            titulo: "¡Qué alegría que estés feliz!",
            texto: "Cuando algo te hace feliz, cuéntaselo a alguien que quieras. La alegría crece cuando se comparte.",
            tip: "Dibuja lo que te puso feliz hoy."
        },
        triste: {
            emoji: "😢",
            titulo: "Está bien sentirse triste",
            texto: "La tristeza también se siente y se vale. No tienes que guardarla solita o solito.",
            tip: "Pídele un abrazo a alguien de confianza."
        },
        enojado: {
            emoji: "😡",
            titulo: "El enojo también se vale",
            texto: "Cuando algo nos molesta el cuerpo se calienta. Podemos soltarlo sin lastimar a nadie.",
            tip: "Aprieta un cojín y cuenta hasta 10."
        },
        asustado: {
            emoji: "😨",
            titulo: "Sentir miedo es normal",
            texto: "El miedo nos avisa que algo nos preocupa. Estás a salvo y puedes pedir ayuda.",
            tip: "Imagina un lugar seguro y respira despacio."
        },
        cansado: {
            emoji: "😴",
            titulo: "Descansar también es crecer",
            texto: "Tu cuerpo y tu mente necesitan pausas. Descansar no es perder el tiempo.",
            tip: "Toma agua y duerme tus horas."
        },
        tranquilo: {
            emoji: "😌",
            titulo: "¡Qué lindo estar en calma!",
            texto: "Esa sensación de tranquilidad es un buen lugar para quedarte un ratito.",
            tip: "Respira hondo y guarda este momento."
        }
    };

    function crearEmociones() {
        const contenedor = document.getElementById("emociones");
        if (!contenedor) return;

        const panel = document.getElementById("emocion-respuesta");
        if (!panel) return;

        const botones = contenedor.querySelectorAll("[data-emocion]");

        botones.forEach((boton) => {
            boton.addEventListener("click", () => {
                const clave = boton.dataset.emocion;
                const datos = RESPUESTAS[clave];
                if (!datos) return;

                botones.forEach((otro) => otro.setAttribute("aria-pressed", "false"));
                boton.setAttribute("aria-pressed", "true");

                panel.innerHTML =
                    '<div class="emocion-respuesta-cabecera">' +
                    `<span aria-hidden="true">${datos.emoji}</span>` +
                    `<h4>${datos.titulo}</h4>` +
                    "</div>" +
                    `<p>${datos.texto}</p>` +
                    `<p class="emocion-tip"><strong>Inténtalo:</strong> ${datos.tip}</p>`;

                panel.hidden = false;
                panel.focus();
            });
        });
    }

    /* =========================================================
       3. Respira conmigo
       ========================================================= */
    function crearRespiracion() {
        const boton = document.getElementById("respiracion-boton");
        if (!boton) return;

        const circulo = document.getElementById("respiracion-circulo");
        const texto = document.getElementById("respiracion-texto");
        const cuenta = document.getElementById("respiracion-cuenta");
        const cicloEl = document.getElementById("respiracion-ciclo");

        const FASES = [
            { nombre: "Inhala por la nariz", duracion: 4, clase: "inhala" },
            { nombre: "Sostén el aire", duracion: 2, clase: "inhala" },
            { nombre: "Exhala por la boca", duracion: 4, clase: "exhala" }
        ];

        let activo = false;
        let ciclo = 0;
        let temporizador = null;

        function detener() {
            clearTimeout(temporizador);
            activo = false;
            boton.textContent = "Comenzar";
            boton.classList.remove("btn-danger");
            boton.classList.add("btn-primary");

            circulo.classList.remove("inhala", "exhala");
            circulo.style.transitionDuration = "0.6s";
            texto.textContent = "Presiona comenzar";
            cuenta.textContent = "";
        }

        function fase(indice) {
            if (!activo) return;

            const actual = FASES[indice];

            circulo.style.transitionDuration = `${actual.duracion}s`;
            circulo.classList.remove("inhala", "exhala");
            circulo.classList.add(actual.clase);
            texto.textContent = actual.nombre;

            let restante = actual.duracion;
            cuenta.textContent = String(restante);

            function tic() {
                if (!activo) return;

                restante--;

                if (restante > 0) {
                    cuenta.textContent = String(restante);
                    temporizador = setTimeout(tic, 1000);
                    return;
                }

                const siguiente = (indice + 1) % FASES.length;

                if (siguiente === 0) {
                    ciclo++;
                    if (cicloEl) cicloEl.textContent = String(ciclo);
                }

                temporizador = setTimeout(() => fase(siguiente), 300);
            }

            temporizador = setTimeout(tic, 1000);
        }

        boton.addEventListener("click", () => {
            if (activo) {
                detener();
                return;
            }

            activo = true;
            ciclo = 0;
            if (cicloEl) cicloEl.textContent = "0";

            boton.textContent = "Detener";
            boton.classList.remove("btn-primary");
            boton.classList.add("btn-danger");

            fase(0);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        crearMemorama();
        crearEmociones();
        crearRespiracion();
    });
})();
