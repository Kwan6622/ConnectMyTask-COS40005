function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';

  // Basic Zod-style validation error handling
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'ValidationError',
      details: err.errors,
    });
  }

  if (err.name && err.name.includes('Prisma')) {
    status = 500;
    message = 'Something went wrong. Please try again.';
  }

  return res.status(status).json({
    error: err.name || 'Error',
    message,
  });
}

module.exports = { errorHandler };

