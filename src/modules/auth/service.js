const bcrypt = require('bcryptjs');
const authRepository = require('./repository');
const { signToken } = require('../../shared/middlewares/auth');

function mapRole(role) {
  if (role === 'CLIENT') return 'REQUESTER';
  if (role === 'PROVIDER') return 'PROVIDER';
  return role;
}

async function signup(payload) {
  const existing = await authRepository.findUserByEmail(payload.email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await authRepository.createUser({
    name: payload.fullName,
    email: payload.email,
    passwordHash,
    role: mapRole(payload.role),
    phone: payload.phone || null,
  });

  const accessToken = signToken(user);

  return { user, accessToken };
}

async function login(email, password) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    const err = new Error('Account locked. Try again later.');
    err.statusCode = 429;
    err.lockedUntil = user.lockoutUntil;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const shouldLock = failedAttempts >= 5;
    const lockoutUntil = shouldLock ? new Date(Date.now() + 10 * 1000) : null;

    await authRepository.updateUserLoginState(user.id, {
      failedLoginAttempts: shouldLock ? 0 : failedAttempts,
      lockoutUntil,
    });

    const err = new Error('Invalid email or password');
    err.statusCode = shouldLock ? 429 : 401;
    if (shouldLock) {
      err.message = 'Too many failed attempts. Account locked for 10 seconds.';
      err.lockedUntil = lockoutUntil;
    }
    throw err;
  }

  if (user.failedLoginAttempts || user.lockoutUntil) {
    await authRepository.updateUserLoginState(user.id, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });
  }

  const accessToken = signToken(user);

  return { user, accessToken };
}

async function getCurrentUser(userId) {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

module.exports = {
  signup,
  login,
  getCurrentUser,
};

