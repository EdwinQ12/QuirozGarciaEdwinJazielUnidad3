// public/js/modoOscuro.js
//
// Cambia entre modo claro y oscuro. La preferencia se guarda en el
// navegador. El botón del navbar está disponible para todos los
// visitantes (antes solo lo veían los usuarios con sesión iniciada).
document.addEventListener("DOMContentLoaded", () => {

    const interruptor = document.getElementById("modoOscuro");   // checkbox (opcional)
    const boton = document.getElementById("modoOscuroBtn");      // botón del navbar
    const icono = boton ? boton.querySelector("i") : null;

    function aplicar(oscuro) {

        document.body.classList.toggle("dark-mode", oscuro);
        localStorage.setItem("modo", oscuro ? "oscuro" : "claro");

        if (interruptor) {
            interruptor.checked = oscuro;
        }

        if (boton) {
            boton.setAttribute("aria-pressed", String(oscuro));
            boton.setAttribute("aria-label", oscuro ? "Activar modo claro" : "Activar modo oscuro");
            boton.title = oscuro ? "Modo claro" : "Modo oscuro";
        }

        if (icono) {
            icono.classList.toggle("fa-moon", !oscuro);
            icono.classList.toggle("fa-sun", oscuro);
        }

    }

    // Recuperar la preferencia guardada.
    aplicar(localStorage.getItem("modo") === "oscuro");

    if (interruptor) {
        interruptor.addEventListener("change", () => aplicar(interruptor.checked));
    }

    if (boton) {
        boton.addEventListener("click", () => {
            aplicar(!document.body.classList.contains("dark-mode"));
        });
    }

});
