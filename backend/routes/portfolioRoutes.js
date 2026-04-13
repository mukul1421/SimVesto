import express from 'express';
import { getPortfolio, analyzePortfolioWithGroq } from '../controllers/portfolioController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getPortfolio);
router.route('/analyze').post(protect, analyzePortfolioWithGroq);

export default router;
