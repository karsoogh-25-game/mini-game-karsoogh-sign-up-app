const express = require('express');
const router = express.Router();
const controller = require('../controllers/economicGamesController');
const { isUser } = require('../middlewares/auth');

router.use(isUser);

// Investment Game
router.get('/investment/status', controller.getInvestmentStatus);
router.post('/investment/invest', controller.invest);

// Risk Game
router.get('/risk/status', controller.getRiskStatus);
router.post('/risk/take', controller.takeRisk);

module.exports = router;
