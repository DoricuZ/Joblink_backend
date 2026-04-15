const bcrypt = require('bcrypt');
const { User } = require('../../models');
const generateToken = require('../utils/generateToken');
const smsService = require('../notifications/sms.service');

// Nigeria normalization
const normalizeNigeriaPhone = (phone) => {

  phone = phone.trim();

  if (phone.startsWith('+234')) return phone;
  if (phone.startsWith('234')) return '+' + phone;
  if (phone.startsWith('0')) return '+234' + phone.substring(1);

  throw new Error('Invalid Nigeria phone format');
};

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();


// ================= REQUEST OTP =================
const requestOTP = async (phone_number) => {

  const normalizedPhone = normalizeNigeriaPhone(phone_number);

  const user = await User.findOne({
    where: { phone_number: normalizedPhone }
  });

  if (!user) throw new Error('User not found');

  const otp = generateOTP();

  const hashedOTP = await bcrypt.hash(otp, 10);

  user.otp_hash = hashedOTP;
  user.otp_expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  user.otp_attempts = 0;

  await user.save();

  // Send SMS
  await smsService.send(
    user.id,
    `Your TradeLink OTP is ${otp}. It expires in 5 minutes.`
  );

  return { message: 'OTP sent successfully' };
};


// ================= VERIFY OTP =================
const verifyOTP = async (phone_number, otp) => {

  const normalizedPhone = normalizeNigeriaPhone(phone_number);

  const user = await User.findOne({
    where: { phone_number: normalizedPhone }
  });

  if (!user || !user.otp_hash)
    throw new Error('OTP not requested');

  if (user.otp_attempts >= 5)
    throw new Error('Too many failed attempts');

  if (new Date() > user.otp_expires_at)
    throw new Error('OTP expired');

  const isValid = await bcrypt.compare(otp, user.otp_hash);

  if (!isValid) {
    user.otp_attempts += 1;
    await user.save();
    throw new Error('Invalid OTP');
  }

  // Clear OTP fields after success
  user.otp_hash = null;
  user.otp_expires_at = null;
  user.otp_attempts = 0;

  await user.save();

  const token = generateToken(user);

  return { user, token };
};

module.exports = {
  requestOTP,
  verifyOTP
};