import express from 'express';
import {
	getStocks,
	getStockBySymbol,
	getLiveStockBySymbol,
	getLiveStocks,
	initializeStocks,
} from '../controllers/stockController.js';

const router = express.Router();

router.route('/init').post(initializeStocks);
router.route('/live').get(getLiveStocks);
router.route('/live/:symbol').get(getLiveStockBySymbol);
router.route('/').get(getStocks);
router.route('/:symbol').get(getStockBySymbol);

export default router;
