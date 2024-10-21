const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const validateInput = require('../middleware/validateInput');

const router = express.Router();

// Routes for user registration and login
router.post('/register', validateInput, registerUser);
router.post('/login', loginUser);

module.exports = router;
