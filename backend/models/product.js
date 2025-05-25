const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../basedeDatos/replikstore.db');
const db = new sqlite3.Database(dbPath);

// Crear tabla de productos si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class Product {
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async create(productData) {
    const { name, description, price, stock, category, image_url } = productData;

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, price, stock, category, image_url],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...productData });
        }
      );
    });
  }

  static async update(id, productData) {
    const { name, description, price, stock, category, image_url } = productData;

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE products 
         SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, description, price, stock, category, image_url, id],
        function(err) {
          if (err) reject(err);
          resolve({ id, ...productData });
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  }
}

module.exports = Product; 