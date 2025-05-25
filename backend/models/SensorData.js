const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensor: { type: String, required: true },
  valor: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
