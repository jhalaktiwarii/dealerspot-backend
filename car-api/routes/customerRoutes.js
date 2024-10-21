const express = require('express');
const { submitCustomerFeedback, getCustomerFeedback } = require('../controllers/customerController');
const extractCompanyName = require('../middleware/extractCompanyName');

const router = express.Router();

router.post('/feedback', extractCompanyName, submitCustomerFeedback);
router.get('/feedback', extractCompanyName, getCustomerFeedback);

module.exports = router;
