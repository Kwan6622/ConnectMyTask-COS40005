/**
 * Lightweight in-memory rate limiter for demo/capstone scope.
 * For production at scale, replace with Redis-backed limiter.
 */
function createRateLimitMiddleware({ windowMs, max, keyPrefix }) {
  const hits = new Map();

  return (req, res, next) => {
    const userId = req.user?.id ? String(req.user.id) : req.ip;
    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();

    const current = hits.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    hits.set(key, current);

    if (current.count > max) {
      return res.status(429).json({
        error: 'RateLimitExceeded',
        message: 'Too many requests. Please try again in a moment.',
      });
    }

    return next();
  };
}

module.exports = { createRateLimitMiddleware };
