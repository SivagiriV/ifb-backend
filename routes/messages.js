const express = require("express");
const twilio = require("twilio");
const Customer = require("../models/customer");
const MessageLog = require("../models/messageLog");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER; // e.g. +1234567
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+1415...

const router = express.Router();

/**
 * Body: { customerIds: [..] } OR { folderId } and { message }
 */
router.post("/send", async (req, res) => {
  try {
    let customers = [];
    if (req.body.folderId) {
      customers = await Customer.find({ folder: req.body.folderId });
    } else if (Array.isArray(req.body.customerIds)) {
      customers = await Customer.find({ _id: { $in: req.body.customerIds } });
    } else {
      return res.status(400).json({ error: "Provide folderId or customerIds" });
    }

    const messageBody = req.body.message;
    if (!messageBody)
      return res.status(400).json({ error: "message required" });

    // filter out invalid numbers
    const validCustomers = customers.filter((c) => c.mobileE164);
    const invalidCount = customers.length - validCustomers.length;

    // send messages in batches to avoid rate limit (simple approach)
    const results = await Promise.all(
      validCustomers.map(async (c) => {
        const logs = [];
        try {
          // SMS
          const sms = await client.messages.create({
            body: messageBody,
            from: TWILIO_FROM,
            to: c.mobileE164,
          });
          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "sms",
            status: sms.status,
            twilioSid: sms.sid,
            body: messageBody,
          });
        } catch (smsErr) {
          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "sms",
            status: "failed",
            twilioSid: null,
            body: messageBody,
          });
        }

        try {
          // WhatsApp
          const wa = await client.messages.create({
            body: messageBody,
            from: TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${c.mobileE164}`,
          });
          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "whatsapp",
            status: wa.status,
            twilioSid: wa.sid,
            body: messageBody,
          });
        } catch (waErr) {
          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "whatsapp",
            status: "failed",
            twilioSid: null,
            body: messageBody,
          });
        }

        // Save logs
        await MessageLog.insertMany(logs);
        return { customerId: c._id, mobile: c.mobileE164, logs };
      })
    );

    res.json({ success: true, sentTo: results.length, invalidCount, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
