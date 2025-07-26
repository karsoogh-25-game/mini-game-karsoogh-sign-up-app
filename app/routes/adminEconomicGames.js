const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminEconomicGamesController');
const { isAdmin } = require('../middlewares/auth');

router.use(isAdmin);

router.get('/status', controller.getGamesStatus);

// Investment Game
router.post('/investment/start', controller.startInvestmentGame);
router.post('/investment/end', controller.endInvestmentGame);

// Risk Game
router.post('/risk/start', controller.startRiskGame);
router.post('/risk/end', controller.endRiskGame);

module.exports = router;
