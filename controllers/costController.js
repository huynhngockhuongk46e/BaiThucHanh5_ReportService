const ProductCost = require('../models/ProductCost');

exports.getAllCosts = async (req, res) => {
    try {
        res.status(200).json(await ProductCost.findAll({ order: [['product_id', 'ASC']] }));
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getCostByProduct = async (req, res) => {
    try {
        const cost = await ProductCost.findOne({ where: { product_id: req.params.productId } });
        if (!cost) return res.status(404).json({ message: 'Chưa có giá vốn cho sản phẩm này' });
        res.status(200).json(cost);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// PUT /reports/costs/:productId  body: { cost_price }  (tạo mới nếu chưa có, cập nhật nếu đã có)
exports.upsertCost = async (req, res) => {
    try {
        const cost_price = Number(req.body.cost_price);
        if (req.body.cost_price === undefined || isNaN(cost_price) || cost_price < 0) {
            return res.status(400).json({ message: 'cost_price phải là số >= 0' });
        }
        const product_id = Number(req.params.productId);
        const [record, created] = await ProductCost.findOrCreate({
            where: { product_id }, defaults: { cost_price }
        });
        if (!created) await record.update({ cost_price });
        res.status(created ? 201 : 200).json(record);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.deleteCost = async (req, res) => {
    try {
        const cost = await ProductCost.findOne({ where: { product_id: req.params.productId } });
        if (!cost) return res.status(404).json({ message: 'Chưa có giá vốn cho sản phẩm này' });
        await cost.destroy();
        res.status(200).json({ message: 'Xóa giá vốn thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
