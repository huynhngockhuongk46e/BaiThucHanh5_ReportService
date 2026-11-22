const assert = require('assert');
const c = require('../services/reportCalculator');

const products = [
    { id: 1, name: 'Chuột', price: '100000', quantity: 50 },
    { id: 2, name: 'Phím', price: '300000', quantity: 20 }
];
const orders = [
    { id: 1, status: 'completed', created_at: '2026-10-05T10:00:00Z',
      items: [{ product_id: 1, product_name: 'Chuột', price: '100000', quantity: 2 },
              { product_id: 2, product_name: 'Phím', price: '300000', quantity: 1 }] },
    { id: 2, status: 'pending', created_at: '2026-10-06T10:00:00Z',
      items: [{ product_id: 1, product_name: 'Chuột', price: '100000', quantity: 5 }] },
    { id: 3, status: 'completed', created_at: '2026-11-01T10:00:00Z',
      items: [{ product_id: 9, product_name: 'SP đã xóa', price: '50000', quantity: 1 }] }
];
const costMap = new Map([[1, 60000], [2, 200000]]);

// mặc định chỉ tính đơn completed
const done = c.filterOrders(orders, { statuses: c.parseStatuses(undefined) });
assert.deepStrictEqual(done.map(o => o.id), [1, 3]);

const orderReport = c.buildOrderReport(done, costMap);
assert.strictEqual(orderReport[0].revenue, 500000);
assert.strictEqual(orderReport[0].cost, 320000);
assert.strictEqual(orderReport[0].profit, 180000);
assert.strictEqual(orderReport[1].cost_missing, true);

const summary = c.buildSummary(products, orderReport);
assert.strictEqual(summary.total_stock_quantity, 70);
assert.strictEqual(summary.total_sold_quantity, 4);
assert.strictEqual(summary.revenue, 550000);
assert.strictEqual(summary.profit, 230000);
assert.strictEqual(summary.orders_with_missing_cost, 1);

const productReport = c.buildProductReport(products, done, costMap);
assert.strictEqual(productReport.find(p => p.product_id === 1).sold_quantity, 2);
assert.strictEqual(productReport.find(p => p.product_id === 9).stock_quantity, null);

// lọc ngày + all
assert.strictEqual(c.filterOrders(orders, { statuses: c.ALL_STATUSES, from: '2026-10-06', to: '2026-10-31' }).length, 1);
assert.throws(() => c.parseStatuses('abc'));

console.log('✅ Tất cả test tính báo cáo đều đạt');
