const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const costController = require('../controllers/costController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

// Giá vốn sản phẩm (dữ liệu riêng của Report Service)
router.get('/costs', costController.getAllCosts);
router.get('/costs/:productId', costController.getCostByProduct);
router.put('/costs/:productId', costController.upsertCost);
router.delete('/costs/:productId', costController.deleteCost);

// Báo cáo
router.get('/summary', reportController.getSummary);
router.get('/products', reportController.getProductReport);
router.get('/products/:id', reportController.getProductReportById);
router.get('/orders', reportController.getOrderReport);
router.get('/orders/:id', reportController.getOrderReportById);

module.exports = router;
