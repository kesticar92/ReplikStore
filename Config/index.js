/**
 * Cargador de configuración para ReplikStore
 * Este archivo maneja la carga de la configuración según el entorno
 */

const path = require('path');
const fs = require('fs');

// Determinar el entorno actual
const env = process.env.NODE_ENV || 'development';

// Ruta al archivo de configuración del entorno
let envConfigPath = path.join(__dirname, `env.${env}.js`);

// Si estamos en desarrollo, intentar cargar primero la configuración local
if (env === 'development') {
  const localConfigPath = path.join(__dirname, 'env.local.js');
  if (fs.existsSync(localConfigPath)) {
    envConfigPath = localConfigPath;
  }
}

// Verificar si existe el archivo de configuración para el entorno
if (!fs.existsSync(envConfigPath)) {
  console.error(`No se encontró el archivo de configuración para el entorno: ${env}`);
  process.exit(1);
}

// Cargar la configuración del entorno
const config = require(envConfigPath);

// Exportar la configuración
module.exports = config; 