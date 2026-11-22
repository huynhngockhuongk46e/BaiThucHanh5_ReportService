# BÀI THỰC HÀNH SỐ 5: DỊCH VỤ BÁO CÁO (REPORT SERVICE)

## 1. Thông tin sinh viên
- **Họ và tên:** ...
- **MSSV:** ...
- **Lớp:** ...

## 2. Mô tả kiến trúc (SOA)
- **Cổng:** 3005 (độc lập với bài 2, 3, 4)
- **Database:** `report_db` (riêng) – chỉ lưu bảng `product_costs` (giá vốn sản phẩm)
- **Xác thực:** JWT cấp từ bài 2 (`JWT_SECRET` trùng khớp)
- **Giao tiếp:** gọi qua HTTP tới Product Service (3003) để lấy tồn kho và Order Service (3004) để lấy đơn hàng.
  Không truy cập trực tiếp DB của service khác.

## 3. Cách tính
- **Tồn kho:** `quantity` từ Product Service
- **Hàng bán được:** tổng `quantity` trong `order_items` của các đơn được tính (mặc định đơn `completed`)
- **Doanh thu** = Σ (giá bán lúc đặt × số lượng)
- **Chi phí** = Σ (giá vốn × số lượng) – giá vốn nhập qua API `/reports/costs`
- **Lợi nhuận** = Doanh thu − Chi phí
- Sản phẩm chưa khai báo giá vốn được tính chi phí = 0 và gắn cờ `cost_missing: true`.

## 4. Cài đặt và chạy
1. `npm install`
2. Chạy `database.sql` (hoặc tạo `report_db`, Sequelize tự tạo bảng)
3. Sửa `.env` (xem `.env.example`)
4. Chạy Product Service (3003) và Order Service (3004) trước, sau đó `node index.js`
5. Kiểm tra logic tính toán: `npm test`

## 5. API (header `Authorization: Bearer <token>`)
| Method | Endpoint | Mô tả |
|---|---|---|
| PUT | `/reports/costs/:productId` | Tạo/cập nhật giá vốn, body `{ "cost_price": 60000 }` |
| GET | `/reports/costs`, `/reports/costs/:productId` | Xem giá vốn |
| DELETE | `/reports/costs/:productId` | Xóa giá vốn |
| GET | `/reports/summary` | Tổng hợp: tồn kho, hàng bán, doanh thu, chi phí, lợi nhuận |
| GET | `/reports/products`, `/reports/products/:id` | Báo cáo theo sản phẩm |
| GET | `/reports/orders`, `/reports/orders/:id` | Báo cáo theo đơn hàng |

**Tham số lọc (summary/products/orders):**
- `status`: mặc định `completed`; ví dụ `?status=completed,shipping` hoặc `?status=all`
- `from`, `to`: `YYYY-MM-DD`, lọc theo ngày tạo đơn

Ví dụ: `GET /reports/summary?from=2026-10-01&to=2026-10-31`
