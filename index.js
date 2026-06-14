require('dotenv').config();
const express = require('express');
const cors = require('cors');

const deliverRoutes = require('./routes/deliver');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = [
  'https://xeno-frontend-brown.vercel.app',
  'https://xeno-backend-coral.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowedOrigins list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deploys or any custom subdomains on vercel.app
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Check dynamic environment variables if configured
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    if (process.env.BACKEND_URL && origin === process.env.BACKEND_URL) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[Channel Service] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api', deliverRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Channel Service Stub is running.' });
});

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Channel Delivery Stub Service running on port ${PORT}`);
    console.log(`Configured CRM URL: ${process.env.CRM_BASE_URL || 'http://localhost:5000'}`);
  });
}

module.exports = app;
