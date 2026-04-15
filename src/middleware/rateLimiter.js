/**
 * Rate Limiter Middleware
 * Prevents brute-force on authentication endpoints.
 * Uses express-rate-limit package.
 */
const rateLimit = require('express-rate-limit');

// Auth limiter: 5 requests per IP per 15-minute window
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP limiter: 3 requests per IP per 15-minute window (stricter to prevent SMS abuse)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, otpLimiter };
