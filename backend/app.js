// Conexión utilizando la ruta completa
const sqlite3 = require('sqlite3').verbose();

// Ruta completa a la base de datos
const dbPath = 'C:/Users/eurbano/PI/ReplikStoreUSC/ReplikStore/backend/basedeDatos/bd_replikstore.db';

// Conectamos a la base de datos SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conexión exitosa a la base de datos SQLite.');
  }
});

// Cerrar la conexión cuando termine
db.close((err) => {
  if (err) {
    console.error('Error al cerrar la base de datos:', err.message);
  } else {
    console.log('Base de datos cerrada.');
  }
});
