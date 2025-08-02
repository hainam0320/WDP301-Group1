const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shipperRoutes = require('./routes/shipperRoutes');
const orderRoutes = require('./routes/orderRoutes');
const rateRoutes = require('./routes/rateRoutes');
const reportRoutes = require('./routes/reportRoutes');
const transactionRoutes = require("./routes/transactionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const payosRoutes = require('./routes/payosRoutes');

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

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let connectedUsers = {}; // { drivers: { userId: socketId }, users: { userId: socketId } }

io.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on('registerUser', ({ userId, role }) => {
        if (!userId || !role) return;

        if (!connectedUsers[role]) {
            connectedUsers[role] = {};
        }
        connectedUsers[role][userId] = socket.id;
        socket.userRole = role; // Lưu vai trò vào socket để dễ xử lý khi disconnect
        socket.userId = userId;

        console.log('Active users:', connectedUsers);
    });

    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected');
        const { userId, userRole } = socket;
        if (userId && userRole && connectedUsers[userRole]) {
            delete connectedUsers[userRole][userId];
        }
        console.log('Active users:', connectedUsers);
    });
});

app.use((req, res, next) => {
    req.io = io;
    req.connectedUsers = connectedUsers;
    next();
});

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/payos', payosRoutes);


// Khởi động server
const PORT = process.env.PORT || 9999;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
