const AuthService = require('../services/auth.service');
const OTPService = require('../services/otp.service');
const { User } = require('../../models');

class AuthController {

  // ================= REGISTER =================
  static async register(req, res, next) {
    try {

      const { user, token } = await AuthService.register(req.body);


      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        data: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role
        }
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= PASSWORD LOGIN =================
  static async login(req, res, next) {
    try {

      const { identifier, password } = req.body;

      const { user, token } = await AuthService.login(identifier, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  static async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          id: req.user.id,
          full_name: req.user.full_name,
          phone_number: req.user.phone_number,
          email: req.user.email,
          role: req.user.role
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // checkPhone and checkEmail removed — user enumeration risk.
  // Duplicate-check logic is handled server-side in AuthService.register().


  // ================= REQUEST OTP =================
  static async requestOTP(req, res, next) {
    try {

      const { phone_number } = req.body;

      const result = await OTPService.requestOTP(phone_number);

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= VERIFY OTP =================
  static async verifyOTP(req, res, next) {
    try {

      const { phone_number, otp } = req.body;

      const { user, token } = await OTPService.verifyOTP(phone_number, otp);

      res.status(200).json({
        success: true,
        message: 'OTP verification successful',
        token,
        data: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role
        }
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= SET PASSWORD =================
  static async setPassword(req, res, next) {
    try {
      const { tempToken, pin } = req.body;

      const result = await AuthService.setPassword(tempToken, pin);

      res.status(200).json({
        success: true,
        message: 'Password set successfully',
        ...result
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= SET SECURITY QUESTION =================
  static async setSecurityQuestion(req, res, next) {
    try {
      const { tempToken, questionText, answer } = req.body;

      const result = await AuthService.setSecurityQuestion(tempToken, questionText, answer);

      res.status(200).json({
        success: true,
        message: 'Security question set successfully',
        ...result
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= FORGOT PASSWORD (Step 1) =================
  static async forgotPassword(req, res, next) {
    try {
      const { phone_number } = req.body;

      const result = await AuthService.forgotPassword(phone_number);

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= VERIFY SECURITY ANSWER (Step 2) =================
  static async verifySecurityAnswer(req, res, next) {
    try {
      const { phone_number, answer } = req.body;

      const result = await AuthService.verifySecurityAnswer(phone_number, answer);

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= RESET PASSWORD (Step 3) =================
  static async resetPassword(req, res, next) {
    try {
      const { phone_number, newPassword, otp } = req.body;

      const result = await AuthService.resetPassword(phone_number, newPassword, otp);

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;