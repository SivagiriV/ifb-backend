const twilio = require("twilio");

// Twilio credentials
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

async function sendSms(to, message) {
  try {
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE, // your Twilio trial number
      to: to.startsWith("+") ? to : `+91${to}`, // auto-add country code if missing
    });
    console.log("✅ SMS sent:", to, sms.sid);
  } catch (err) {
    console.error("❌ SMS error:", err.message);
  }
}

module.exports = sendSms;
