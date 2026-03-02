const { ZodError } = require('zod');

/**
 * Creates an Express middleware that validates parts of the request
 * (body, params, query) using Zod schemas.
 */
function createValidationMiddleware({ body, params, query }) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        err.name = 'ZodError';
      }
      return next(err);
    }
  };
}

module.exports = {
  createValidationMiddleware,
};

