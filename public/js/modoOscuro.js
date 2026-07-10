document.addEventListener("DOMContentLoaded", () => {

    const interruptor = document.getElementById("modoOscuro");

    // Recuperar la preferencia guardada
    if (localStorage.getItem("modo") === "oscuro") {

        document.body.classList.add("dark-mode");

        if (interruptor) {
            interruptor.checked = true;
        }

    }

    // Escuchar el cambio del switch
    if (interruptor) {

        interruptor.addEventListener("change", () => {

            if (interruptor.checked) {

                document.body.classList.add("dark-mode");

                localStorage.setItem("modo", "oscuro");

            } else {

                document.body.classList.remove("dark-mode");

                localStorage.setItem("modo", "claro");

            }

        });

    }

});