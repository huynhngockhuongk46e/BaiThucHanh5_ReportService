const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// Giá vốn (chi phí nhập) của từng sản phẩm - do Report Service quản lý trong DB riêng.
// product_id không phải khóa ngoại vì sản phẩm nằm ở Product Service (DB khác).
const ProductCost = sequelize.define('ProductCost', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    cost_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
    tableName: 'product_costs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = ProductCost;
