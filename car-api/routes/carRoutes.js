const express = require('express');
const { submitCarData, getAllCars, updateCarStatus, getAllCarsWithPagination,  } = require('../controllers/carController');
const extractCompanyName = require('../middleware/extractCompanyName');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', extractCompanyName, upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), submitCarData);

router.get('/my-cars', extractCompanyName, getAllCars);  // For fetching company-specific cars
router.get('/all', getAllCarsWithPagination);  // For fetching all cars
 router.put('/:model/status', extractCompanyName, updateCarStatus);

module.exports = router;
