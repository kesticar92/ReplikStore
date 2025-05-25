const SensorData = require('../models/SensorData');

// GET: obtener todas las lecturas
const getAllSensorData = async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET: último dato por sensor
const getLastSensorValue = async (req, res) => {
  const { sensor } = req.params;
  try {
    const data = await SensorData.findOne({ sensor }).sort({ timestamp: -1 });
    if (!data) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener último dato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  receiveSensorData,
  getAllSensorData,
  getLastSensorValue
};
