const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { env } = require('./config/env');
const { errorHandler } = require('./shared/middlewares/errorHandler');
const { notFoundHandler } = require('./shared/middlewares/notFoundHandler');
const { requestLogger } = require('./shared/middlewares/requestLogger');

const authRoutes = require('./modules/auth/routes');
const taskRoutes = require('./modules/tasks/routes');
const bidRoutes = require('./modules/bids/routes');
const reviewRoutes = require('./modules/reviews/routes');
const trackingRoutes = require('./modules/tracking/routes');
const aiRoutes = require('./modules/ai-integration/routes');
const userRoutes = require('./modules/users/routes');

const app = express();

app.use(cors());
app.use(express.json());

// HTTP request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Structured request logging middleware
app.use(requestLogger);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', bidRoutes); // includes /bids and /tasks/:id/bids
app.use('/api', reviewRoutes); // includes /reviews and /providers/:id/reviews
app.use('/api/tracking', trackingRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'connectmytask-api' });
});

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

