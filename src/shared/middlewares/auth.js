const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
  } catch (err) {
    // ignore invalid token for optional auth
  }
  return next();
}

function requireRoles(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toUpperCase());
  return (req, res, next) => {
    const role = String(req.user?.role || '').toUpperCase();
    if (!role) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing user role' });
    }
    if (!normalizedAllowedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Only ${normalizedAllowedRoles.join(' or ')} can access this resource`,
      });
    }
    return next();
  };
}

function signToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '1h',
  });

  return token;
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireRoles,
  signToken,
};

