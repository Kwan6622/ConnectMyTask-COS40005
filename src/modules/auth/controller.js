const authService = require('./service');

async function signup(req, res, next) {
  try {
    const { user, accessToken } = await authService.signup(req.body);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, accessToken } = await authService.login(
      req.body.email,
      req.body.password
    );
    res.json({ user, accessToken });
  } catch (err) {
    if (err.statusCode === 429) {
      return res.status(429).json({
        error: 'TooManyAttempts',
        message: err.message,
        lockedUntil: err.lockedUntil,
      });
    }
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // Stateless JWT logout handled on client; respond OK.
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    // Simple implementation: just re-issue token from existing user in context if present.
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const { signToken } = require('../../shared/middlewares/auth');
    const token = signToken(req.user);
    res.json({ accessToken: token });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  me,
  logout,
  refresh,
};

