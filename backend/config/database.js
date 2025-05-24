const path = require('path');

const dbConfig = {
    path: path.join(__dirname, '../basedeDatos/bd_replikstore.db'),
    options: {
        verbose: true,
        timeout: 5000
    }
};

module.exports = dbConfig; 