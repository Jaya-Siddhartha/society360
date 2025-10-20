const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Society 360 API is running!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/society360')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
  console.log(`📱 Network access: http://localhost:${PORT}`);
  
  // Try to show the actual network IP if possible
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const addresses = networkInterfaces[interfaceName];
    addresses.forEach(address => {
      if (address.family === 'IPv4' && !address.internal) {
        console.log(`🌐 Network access: http://${address.address}:${PORT}`);
      }
    });
  });
});

module.exports = app;
