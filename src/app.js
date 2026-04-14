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
const notificationRoutes = require('./modules/notifications/routes');
const paymentRoutes = require('./modules/payments/routes');
const chatRoutes = require('./modules/chat/routes');
const ratingRoutes = require('./modules/ratings/routes');
const adminRoutes = require('./modules/admin/routes');
const platformRoutes = require('./modules/platform/routes');

const app = express();

app.use(cors());
// Stripe webhook needs raw request body for signature verification.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
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
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', ratingRoutes);
app.use('/api', bidRoutes); // includes /bids and /tasks/:id/bids
app.use('/api', reviewRoutes); // includes /reviews and /providers/:id/reviews
app.use('/api/tracking', trackingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/platform', platformRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'connectmytask-api' });
});

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

