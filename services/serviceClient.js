// Gọi các service khác qua HTTP (không truy cập trực tiếp DB của chúng).
require('dotenv').config();

const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';

class ServiceError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function callService(name, url, token) {
    let response;
    try {
        response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
        throw new ServiceError(`Không kết nối được ${name}`, 503);
    }
    if (response.status === 401 || response.status === 403) {
        throw new ServiceError(`${name} từ chối token`, 401);
    }
    if (!response.ok) {
        throw new ServiceError(`${name} trả về lỗi (${response.status})`, 502);
    }
    return response.json();
}

const fetchProducts = (token) => callService('Product Service', `${PRODUCT_URL}/products`, token);
const fetchOrders = (token) => callService('Order Service', `${ORDER_URL}/orders`, token);

module.exports = { fetchProducts, fetchOrders, ServiceError };
