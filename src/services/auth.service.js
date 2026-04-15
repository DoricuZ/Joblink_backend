const { User, SecurityQuestion } = require('../../models');
const generateToken = require('../utils/generateToken');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Normalize Nigeria phone numbers to +234 format
 */
const normalizeNigeriaPhone = (phone) => {

  if (!phone) return null;

  phone = phone.trim();

  if (phone.startsWith('+234')) return phone;

  if (phone.startsWith('234'))
    return '+' + phone;

  if (phone.startsWith('0'))
    return '+234' + phone.substring(1);

  throw new Error('Invalid Nigeria phone number format');
};

class AuthService {

  // ================= REGISTER =================
  static async register(data) {

    const { first_name, last_name, phone_number, email, password, userType } = data;

    if (!['worker', 'admin', 'employer'].includes(userType)) {
      throw new Error('Invalid role selected');
    }
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = normalizeNigeriaPhone(phone_number);

    // Validate employer email requirement
    if (userType === 'employer' && !normalizedEmail) {
      throw new Error('Email address is required for employer accounts');
    }

    const existingPhone = await User.findOne({ where: { phone_number: normalizedPhone } });
    if (existingPhone) {
      throw new Error('This phone number is already registered.');
    }

    if (normalizedEmail) {
      const existingEmail = await User.findOne({ where: { email: normalizedEmail } });
      if (existingEmail) {
        throw new Error('This email is already registered.');
      }
    }


    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }



    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { phone_number: normalizedPhone }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const user = await User.create({
      first_name,
      last_name,
      email: normalizedEmail,
      phone_number: normalizedPhone,
      password_hash: hashedPassword,
      role: userType
    });

    const token = generateToken(user);

    return { user, token };
  }


  // ================= LOGIN =================
  static async login(identifier, password) {

    if (!identifier || !password) {
      throw new Error('Email/Phone and password required');
    }

    let normalizedIdentifier = identifier.trim().toLowerCase();

    // If it's a phone number, normalize it
    if (/^\d+$/.test(normalizedIdentifier) || normalizedIdentifier.startsWith('+')) {
      normalizedIdentifier = normalizeNigeriaPhone(normalizedIdentifier);
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedIdentifier },
          { phone_number: normalizedIdentifier }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    //  Compare hashed password
    const isValidPassword = await bcrypt.compare(
      password.trim(),
      user.password_hash
    );

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user);

    return { user, token };
  }


  // ================= SET PASSWORD =================
  static async setPassword(tempToken, pin) {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error('User not found');

    if (!pin || pin.length < 4) {
      throw new Error('PIN must be at least 4 characters');
    }

    const hashed = await bcrypt.hash(pin, 10);
    user.password_hash = hashed;
    await user.save();

    const newTempToken = jwt.sign(
      { id: user.id, role: user.role, step: 'security-question' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { tempToken: newTempToken };
  }


  // ================= SET SECURITY QUESTION =================
  static async setSecurityQuestion(tempToken, questionText, answer) {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error('User not found');

    if (!questionText || !answer) {
      throw new Error('Question and answer are required');
    }

    const answerHash = await bcrypt.hash(answer.trim().toLowerCase(), 10);

    await SecurityQuestion.create({
      user_id: user.id,
      question_text: questionText,
      answer_hash: answerHash
    });

    const nextTempToken = jwt.sign(
      { id: user.id, role: user.role, step: 'otp' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { tempToken: nextTempToken };
  }


  // ================= FORGOT PASSWORD (Step 1) =================
  static async forgotPassword(phone_number) {
    const user = await User.findOne({
      where: { phone_number },
      include: {
        model: SecurityQuestion,
        as: 'securityQuestions'
      }
    });

    // Always respond success (prevent enumeration)
    if (!user || user.securityQuestions.length === 0) {
      return {
        found: false,
        message: 'If this number is registered, your security question will appear.'
      };
    }

    return {
      found: true,
      question: user.securityQuestions[0].question_text
    };
  }


  // ================= VERIFY SECURITY ANSWER (Step 2) =================
  static async verifySecurityAnswer(phone_number, answer) {
    const user = await User.findOne({
      where: { phone_number },
      include: {
        model: SecurityQuestion,
        as: 'securityQuestions'
      }
    });

    if (!user || user.securityQuestions.length === 0) {
      throw new Error('Invalid request');
    }

    // Check lock
    if (user.security_lock_until && new Date(user.security_lock_until) > new Date()) {
      throw new Error('Too many failed attempts. Try again later.');
    }

    const security = user.securityQuestions[0];

    const isCorrect = await bcrypt.compare(
      answer.trim().toLowerCase(),
      security.answer_hash
    );

    if (!isCorrect) {
      user.failed_security_attempts = (user.failed_security_attempts || 0) + 1;

      if (user.failed_security_attempts >= 3) {
        user.security_lock_until = new Date(Date.now() + 30 * 60 * 1000);
      }

      await user.save();

      const remaining = 3 - user.failed_security_attempts;
      throw new Error(`Incorrect answer. ${remaining > 0 ? remaining : 0} attempt(s) remaining.`);
    }

    // Reset failed attempts
    user.failed_security_attempts = 0;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_code = otp;
    user.otp_expires = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    // Send OTP via SMS
    const smsService = require('../notifications/sms.service');
    await smsService.send(user.id, `Your TradeLink password reset OTP is ${otp}. It expires in 5 minutes.`);

    return { message: 'OTP sent to your phone.' };
  }


  // ================= RESET PASSWORD (Step 3) =================
  static async resetPassword(phone_number, newPassword, otp) {
    const user = await User.findOne({ where: { phone_number } });
    if (!user) throw new Error('Invalid request');

    // Validate OTP
    if (!user.otp_code || user.otp_code !== otp || new Date() > new Date(user.otp_expires)) {
      throw new Error('Invalid or expired OTP.');
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(newPassword)) {
      throw new Error('PIN must be exactly 6 digits.');
    }

    // Prevent same password
    const isSame = await bcrypt.compare(newPassword, user.password_hash);
    if (isSame) {
      throw new Error('New PIN must be different from old PIN.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password_hash = hashed;
    user.otp_code = null;
    user.otp_expires = null;
    user.failed_security_attempts = 0;
    user.security_lock_until = null;

    await user.save();

    return { message: 'PIN reset successful.' };
  }
}
module.exports = AuthService;