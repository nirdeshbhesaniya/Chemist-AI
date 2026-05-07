require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/manufacturing', require('./routes/manufacturing'));
app.use('/api/optimize', require('./routes/optimize'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/retrosynthesis', require('./routes/retrosynthesis'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/patents', require('./routes/patents'));
app.use('/api/history', require('./routes/history'));
app.use('/api/pricing', require('./routes/pricing'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chemist AI API running', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🧪 Chemist AI Server running on port ${port}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(e);
    }
  });
};

const INITIAL_PORT = parseInt(process.env.PORT, 10) || 5000;
startServer(INITIAL_PORT);

module.exports = app;
