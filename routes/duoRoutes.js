const express = require('express');
const { initiateDuo, verifyDuo } = require('../controllers/authController');
const router = express.Router();

// Route to initiate Duo authentication (triggered after successful login)
router.post('/duo-auth', initiateDuo);

// Route to verify the Duo authentication token (called after user interacts with the Duo widget)
router.post('/duo/verify', verifyDuo);

module.exports = router;
