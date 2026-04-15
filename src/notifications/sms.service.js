require('dotenv').config();
const axios = require('axios');
const { User } = require('../../models');

const SMS_API_URL = 'https://api.africastalking.com/version1/messaging';
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_USERNAME = process.env.SMS_USERNAME; 

const send = async (user_id, message) => {
  try {
    // 1️⃣ Fetch user
    const user = await User.findByPk(user_id);

    if (!user) throw new Error('User not found for SMS');
    if (!user.phone_number) throw new Error('User has no phone number');

    const phone = formatPhone(user.phone_number);

    // 2️⃣ Mock in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 Mock SMS to ${phone}: ${message}`);
      return true;
    }

    // 3️⃣ Africa's Talking request
    const response = await axios.post(
      SMS_API_URL,
      new URLSearchParams({
        username: SMS_USERNAME,
        to: phone,
        message
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': SMS_API_KEY
        },
        timeout: 10000
      }
    );

    // 4️⃣ Verify delivery
    const result = response.data.SMSMessageData;
    if (!result || !result.Recipients || result.Recipients.length === 0) {
      throw new Error('SMS sending failed');
    }

    // Check recipient status
    const recipient = result.Recipients[0];
    if (recipient.status !== 'Success') {
      throw new Error(`SMS delivery failed: ${recipient.status}`);
    }

    return true;

  } catch (error) {
    console.error('SMS sending failed:', error.message);
    return false;
  }
};

// Utility to normalize phone numbers to E.164
function formatPhone(phone) {
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return `+254${phone.substring(1)}`; // Kenya example
  return phone;
}

module.exports = {
  send
};