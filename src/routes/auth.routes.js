const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Rate limiting applied to all auth endpoints
// check-phone and check-email endpoints REMOVED

router.post('/register', AuthController.register);
router.post('/login', authLimiter, AuthController.login);

router.get('/me', authenticate, AuthController.getMe);

router.post('/send-otp', otpLimiter, AuthController.requestOTP);
router.post('/verify-otp', authLimiter, AuthController.verifyOTP);
router.post('/set-password', AuthController.setPassword);
router.post('/set-security-question', AuthController.setSecurityQuestion);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-security-answer', authLimiter, AuthController.verifySecurityAnswer);
router.post('/reset-password', authLimiter, AuthController.resetPassword);

module.exports = router;
