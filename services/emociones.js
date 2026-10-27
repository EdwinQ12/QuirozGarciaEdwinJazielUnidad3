// services/emociones.js
//
// Catálogo de emociones que se usan en el diario y en el dashboard.
const EMOCIONES = [
    { clave: "feliz", emoji: "😀", nombre: "Feliz" },
    { clave: "triste", emoji: "😢", nombre: "Triste" },
    { clave: "enojado", emoji: "😡", nombre: "Enojado" },
    { clave: "asustado", emoji: "😨", nombre: "Asustado" },
    { clave: "cansado", emoji: "😴", nombre: "Cansado" },
    { clave: "tranquilo", emoji: "😌", nombre: "Tranquilo" }
];

const MAPA = {};
EMOCIONES.forEach((emocion) => {
    MAPA[emocion.clave] = emocion;
});

module.exports = { EMOCIONES, MAPA };
