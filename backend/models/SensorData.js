const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensor: { type: String, required: true },
  valor: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// Método estático para obtener los sensores más activos
SensorData.getTopSensors = async function(limit = 5) {
  try {
    const result = await this.aggregate([
      { $group: { _id: '$sensor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    return result.map(item => ({
      sensor: item._id,
      count: item.count
    }));
  } catch (error) {
    throw error;
  }
};

module.exports = SensorData;
