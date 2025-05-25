const express = require('express');
const router = express.Router();
const {
  receiveSensorData,
  getAllSensorData,
  getLastSensorValue
} = require('../controllers/sensorController');

router.post('/data', receiveSensorData);
router.get('/', getAllSensorData);
router.get('/:sensor', getLastSensorValue);

module.exports = router;
