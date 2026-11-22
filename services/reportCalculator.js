// Các hàm thuần (không gọi DB/HTTP) để tính báo cáo => dễ kiểm thử.

const ALL_STATUSES = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
const num = (v) => Number(v) || 0;
const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

// ?status omitted -> ['completed']; ?status=all -> tất cả; ?status=completed,shipping -> danh sách
function parseStatuses(statusQuery) {
    if (!statusQuery) return ['completed'];
    if (statusQuery === 'all') return ALL_STATUSES;
    const list = String(statusQuery).split(',').map(s => s.trim()).filter(Boolean);
    const invalid = list.filter(s => !ALL_STATUSES.includes(s));
    if (invalid.length) {
        const err = new Error(`Trạng thái không hợp lệ: ${invalid.join(', ')}. Cho phép: ${ALL_STATUSES.join(', ')}, all`);
        err.status = 400;
        throw err;
    }
    return list;
}

// Lọc đơn theo trạng thái và khoảng ngày (from/to dạng YYYY-MM-DD, theo created_at)
function filterOrders(orders, { statuses, from, to }) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (toDate) toDate.setUTCHours(23, 59, 59, 999);
    if ((fromDate && isNaN(fromDate)) || (toDate && isNaN(toDate))) {
        const err = new Error('from/to phải có dạng YYYY-MM-DD');
        err.status = 400;
        throw err;
    }
    return orders.filter(o => {
        if (!statuses.includes(o.status)) return false;
        const created = new Date(o.created_at || o.createdAt);
        if (fromDate && created < fromDate) return false;
        if (toDate && created > toDate) return false;
        return true;
    });
}

// costMap: Map(product_id -> cost_price)
function itemFigures(item, costMap) {
    const qty = num(item.quantity);
    const revenue = num(item.price) * qty;
    const hasCost = costMap.has(Number(item.product_id));
    const cost = hasCost ? costMap.get(Number(item.product_id)) * qty : 0;
    return { qty, revenue, cost, profit: revenue - cost, hasCost };
}

function buildOrderReport(orders, costMap) {
    return orders.map(order => {
        let revenue = 0, cost = 0, quantity = 0, missing = false;
        const items = (order.items || []).map(it => {
            const f = itemFigures(it, costMap);
            revenue += f.revenue; cost += f.cost; quantity += f.qty;
            if (!f.hasCost) missing = true;
            return {
                product_id: it.product_id,
                product_name: it.product_name,
                quantity: f.qty,
                unit_price: num(it.price),
                revenue: round2(f.revenue),
                cost: round2(f.cost),
                profit: round2(f.profit),
                cost_missing: !f.hasCost
            };
        });
        return {
            order_id: order.id,
            status: order.status,
            created_at: order.created_at || order.createdAt,
            total_quantity: quantity,
            revenue: round2(revenue),
            cost: round2(cost),
            profit: round2(revenue - cost),
            cost_missing: missing,
            items
        };
    });
}

function buildProductReport(products, orders, costMap) {
    const map = new Map();

    for (const p of products) {
        map.set(Number(p.id), {
            product_id: Number(p.id),
            product_name: p.name,
            unit_price: num(p.price),
            cost_price: costMap.has(Number(p.id)) ? costMap.get(Number(p.id)) : null,
            stock_quantity: num(p.quantity),
            sold_quantity: 0, revenue: 0, cost: 0, profit: 0
        });
    }

    for (const order of orders) {
        for (const it of order.items || []) {
            const id = Number(it.product_id);
            if (!map.has(id)) {
                // Sản phẩm đã bị xóa khỏi Product Service nhưng vẫn có trong đơn
                map.set(id, {
                    product_id: id, product_name: it.product_name, unit_price: num(it.price),
                    cost_price: costMap.has(id) ? costMap.get(id) : null,
                    stock_quantity: null, sold_quantity: 0, revenue: 0, cost: 0, profit: 0
                });
            }
            const row = map.get(id);
            const f = itemFigures(it, costMap);
            row.sold_quantity += f.qty;
            row.revenue += f.revenue;
            row.cost += f.cost;
            row.profit += f.profit;
        }
    }

    return [...map.values()]
        .map(r => ({
            ...r,
            revenue: round2(r.revenue), cost: round2(r.cost), profit: round2(r.profit),
            cost_missing: r.cost_price === null
        }))
        .sort((a, b) => a.product_id - b.product_id);
}

function buildSummary(products, orderReport) {
    const revenue = orderReport.reduce((s, o) => s + o.revenue, 0);
    const cost = orderReport.reduce((s, o) => s + o.cost, 0);
    return {
        total_products: products.length,
        total_stock_quantity: products.reduce((s, p) => s + num(p.quantity), 0),
        total_orders: orderReport.length,
        total_sold_quantity: orderReport.reduce((s, o) => s + o.total_quantity, 0),
        revenue: round2(revenue),
        cost: round2(cost),
        profit: round2(revenue - cost),
        profit_margin_percent: revenue > 0 ? round2(((revenue - cost) / revenue) * 100) : 0,
        orders_with_missing_cost: orderReport.filter(o => o.cost_missing).length
    };
}

module.exports = {
    ALL_STATUSES, parseStatuses, filterOrders, buildOrderReport, buildProductReport, buildSummary
};
