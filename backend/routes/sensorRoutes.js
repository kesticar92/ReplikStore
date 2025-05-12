const express = require('express');
const router = express.Router();
const {
  receiveSensorData,
  getAllSensorData,
  getLastSensorValue
} = require('../controllers/sensorController');

router.post('/api/sensores', receiveSensorData);
router.get('/api/sensores', getAllSensorData);
router.get('/api/sensores/:sensor', getLastSensorValue);

module.exports = router;
