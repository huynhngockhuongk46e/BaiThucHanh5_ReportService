const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./db');
require('./models/ProductCost');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/reports', reportRoutes);

const PORT = process.env.PORT || 3005;

sequelize.sync().then(() => {
    console.log('✅ Kết nối Database report_db thành công!');
    app.listen(PORT, () => {
        console.log(`🚀 Report Service (Bài 5) đang chạy trên cổng ${PORT}`);
    });
}).catch(err => console.error('❌ Lỗi kết nối DB:', err));
