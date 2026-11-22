const ProductCost = require('../models/ProductCost');
const { fetchProducts, fetchOrders, ServiceError } = require('../services/serviceClient');
const calc = require('../services/reportCalculator');

const getToken = (req) => req.headers['authorization'].split(' ')[1];

const handleError = (res, error) => {
    if (error instanceof ServiceError || error.status) {
        return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
};

async function loadCostMap() {
    const costs = await ProductCost.findAll();
    return new Map(costs.map(c => [Number(c.product_id), Number(c.cost_price)]));
}

// Lấy dữ liệu từ Product Service + Order Service rồi lọc theo query
async function loadData(req) {
    const token = getToken(req);
    const statuses = calc.parseStatuses(req.query.status);
    const [products, allOrders, costMap] = await Promise.all([
        fetchProducts(token), fetchOrders(token), loadCostMap()
    ]);
    const orders = calc.filterOrders(allOrders, { statuses, from: req.query.from, to: req.query.to });
    return { products, orders, costMap, statuses };
}

// GET /reports/summary — tồn kho, hàng bán được, doanh thu, chi phí, lợi nhuận
exports.getSummary = async (req, res) => {
    try {
        const { products, orders, costMap, statuses } = await loadData(req);
        const orderReport = calc.buildOrderReport(orders, costMap);
        res.status(200).json({
            filters: { status: statuses, from: req.query.from || null, to: req.query.to || null },
            ...calc.buildSummary(products, orderReport)
        });
    } catch (error) {
        handleError(res, error);
    }
};

// GET /reports/products — báo cáo theo sản phẩm
exports.getProductReport = async (req, res) => {
    try {
        const { products, orders, costMap } = await loadData(req);
        res.status(200).json(calc.buildProductReport(products, orders, costMap));
    } catch (error) {
        handleError(res, error);
    }
};

// GET /reports/products/:id
exports.getProductReportById = async (req, res) => {
    try {
        const { products, orders, costMap } = await loadData(req);
        const row = calc.buildProductReport(products, orders, costMap)
            .find(r => r.product_id === Number(req.params.id));
        if (!row) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json(row);
    } catch (error) {
        handleError(res, error);
    }
};

// GET /reports/orders — báo cáo theo đơn hàng
exports.getOrderReport = async (req, res) => {
    try {
        const { orders, costMap } = await loadData(req);
        res.status(200).json(calc.buildOrderReport(orders, costMap));
    } catch (error) {
        handleError(res, error);
    }
};

// GET /reports/orders/:id
exports.getOrderReportById = async (req, res) => {
    try {
        const token = getToken(req);
        const [allOrders, costMap] = await Promise.all([fetchOrders(token), loadCostMap()]);
        const order = allOrders.find(o => o.id === Number(req.params.id));
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.status(200).json(calc.buildOrderReport([order], costMap)[0]);
    } catch (error) {
        handleError(res, error);
    }
};
