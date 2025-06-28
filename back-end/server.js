const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shipperRoutes = require('./routes/shipperRoutes');
const orderRoutes = require('./routes/orderRoutes');
const rateRoutes = require('./routes/rateRoutes');
const reportRoutes = require('./routes/reportRoutes');
const transactionRoutes = require("./routes/transactionRoutes");

require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());


// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Serve static files (ảnh từ /uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shipper', shipperRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rate', rateRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/transactions", transactionRoutes);


// Khởi động server
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
