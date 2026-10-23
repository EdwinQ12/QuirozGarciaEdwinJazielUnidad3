// public/js/rayito.js
//
// Interactividad general del sitio:
//   - La mascota "Rayito" (ojos que siguen al cursor y frases al tocarla).
//   - Inclinación 3D de las tarjetas.
//   - Confeti (se reutiliza en los juegos con window.Rayito.confeti()).
//
// Respeta la preferencia "reducir movimiento" del sistema operativo.
(function () {
    "use strict";

    const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------------------------------------------------------
       Mascota
       --------------------------------------------------------- */
    function iniciarMascota() {
        const mascota = document.querySelector("[data-rayito]");
        if (!mascota) return;

        const burbuja = mascota.querySelector("[data-burbuja]");
        const pupilas = mascota.querySelectorAll("[data-pupila]");
        if (!burbuja) return;

        const frases = [
            "¡Hola! Soy Rayito 🌞",
            "Respira profundo… huele una flor 🌸",
            "Hoy es un buen día para sonreír 😊",
            "Pedir ayuda también es de valientes 💪",
            "¿Ya viste los juegos del Rincón? 🎈",
            "Un abrazo cura casi todo 🤗",
            "Cuando te enojes, cuenta hasta 10 🔟",
            "Eres más valiente de lo que crees ⭐",
            "Tomar agua también te da energía 💧"
        ];

        let ultima = -1;
        let temporizador = null;

        function decir() {
            let indice = Math.floor(Math.random() * frases.length);

            // Evita repetir la misma frase dos veces seguidas.
            if (indice === ultima) {
                indice = (indice + 1) % frases.length;
            }
            ultima = indice;

            burbuja.textContent = frases[indice];
            burbuja.classList.add("visible");

            clearTimeout(temporizador);
            temporizador = setTimeout(() => burbuja.classList.remove("visible"), 4000);
        }

        mascota.addEventListener("click", decir);

        mascota.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                decir();
            }
        });

        // Los ojos siguen al cursor.
        if (!menosMovimiento && pupilas.length > 0) {
            window.addEventListener(
                "mousemove",
                (evento) => {
                    const caja = mascota.getBoundingClientRect();
                    const centroX = caja.left + caja.width / 2;
                    const centroY = caja.top + caja.height / 2;

                    const dx = Math.max(-1, Math.min(1, (evento.clientX - centroX) / (caja.width / 2)));
                    const dy = Math.max(-1, Math.min(1, (evento.clientY - centroY) / (caja.height / 2)));

                    pupilas.forEach((pupila) => {
                        pupila.style.transform = `translate(${(dx * 5).toFixed(1)}px, ${(dy * 4).toFixed(1)}px)`;
                    });
                },
                { passive: true }
            );
        }

        // Saluda al entrar a la página.
        setTimeout(decir, 1200);
    }

    /* ---------------------------------------------------------
       Inclinación 3D
       --------------------------------------------------------- */
    function iniciarTilt() {
        if (menosMovimiento) return;
        if (!window.matchMedia("(hover: hover)").matches) return;

        const tarjetas = document.querySelectorAll(".evento-cards, [data-tilt]");

        tarjetas.forEach((tarjeta) => {
            tarjeta.addEventListener(
                "mousemove",
                (evento) => {
                    const caja = tarjeta.getBoundingClientRect();
                    const px = (evento.clientX - caja.left) / caja.width - 0.5;
                    const py = (evento.clientY - caja.top) / caja.height - 0.5;

                    const giroX = (-py * 8).toFixed(2);
                    const giroY = (px * 8).toFixed(2);

                    tarjeta.style.transform =
                        `perspective(900px) rotateX(${giroX}deg) rotateY(${giroY}deg) translateY(-6px)`;
                },
                { passive: true }
            );

            tarjeta.addEventListener("mouseleave", () => {
                tarjeta.style.transform = "";
            });
        });
    }

    /* ---------------------------------------------------------
       Confeti
       --------------------------------------------------------- */
    const COLORES = ["#ffc107", "#4facfe", "#00f2fe", "#ff6b9d", "#7bd389", "#a78bfa"];

    function confeti(cantidad) {
        if (menosMovimiento) return;

        const total = cantidad || 70;

        for (let i = 0; i < total; i++) {
            const papelito = document.createElement("div");
            papelito.className = "confeti";
            papelito.setAttribute("aria-hidden", "true");
            papelito.style.left = `${Math.random() * 100}vw`;
            papelito.style.background = COLORES[Math.floor(Math.random() * COLORES.length)];
            papelito.style.animationDelay = `${(Math.random() * 0.6).toFixed(2)}s`;

            document.body.appendChild(papelito);

            setTimeout(() => papelito.remove(), 3600);
        }
    }

    window.Rayito = { confeti };

    /* ---------------------------------------------------------
       Arranque
       --------------------------------------------------------- */
    document.addEventListener("DOMContentLoaded", () => {
        iniciarMascota();
        iniciarTilt();
    });
})();
