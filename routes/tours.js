const express = require('express');
const router = express.Router();
const { getTours, createTour } = require('../controllers/tourController');

router.get('/', getTours);
router.post('/', createTour);

module.exports = router;