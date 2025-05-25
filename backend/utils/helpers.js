// helpers.js básico

module.exports = {
    // Puedes agregar funciones auxiliares aquí según las vayas necesitando
    noop: () => {},
    isDefined: (val) => typeof val !== 'undefined' && val !== null,
    toTitleCase: (str) => str ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '',
}; 