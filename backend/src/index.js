require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const db = require('./config/db');
const { initRedis } = require('./config/redis');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const schedulesRoutes = require('./routes/schedules');
const bookingsRoutes = require('./routes/bookings');
const centersRoutes = require('./routes/centers');
const officersRoutes = require('./routes/officers');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/centers', centersRoutes);
app.use('/api/officers', officersRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Init services
initRedis().catch(console.error);
initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
