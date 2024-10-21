const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeTables } = require('./utils/awsConfig');
const carRoutes = require('./routes/carRoutes');
const friendRoutes = require('./routes/friendRoutes');
const customerRoutes = require('./routes/customerRoutes');
const monthlyExpenseRoutes = require('./routes/monthlyExpenseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { setIo } = require('./services/notificationService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGINS.split(','),
    methods: ["GET", "POST"]
  }
});

setIo(io);

const port = process.env.PORT || 5000;

// Set CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGINS.split(',');

app.use(cors({
  origin: corsOrigins,
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/cars', carRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/monthly-expenses', monthlyExpenseRoutes);
app.use('/api/notifications', notificationRoutes);

// Initialize DynamoDB tables
initializeTables().catch(console.error);

// Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (companyName) => {
    socket.join(companyName);
    console.log(`Client joined room: ${companyName}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app };
