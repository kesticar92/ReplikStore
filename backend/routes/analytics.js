const express = require('express');
const router = express.Router();

router.get('/metrics', (req, res) => {
    res.json({});
});

module.exports = router; 