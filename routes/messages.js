const express = require("express");
const twilio = require("twilio");
const moment = require("moment");
const Customer = require("../models/customer");
const MessageLog = require("../models/messageLog");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_FROM = process.env.TWILIO_PHONE;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const MESSAGE_CONTENT_SID = process.env.MESSAGE_CONTENT_SID;
const router = express.Router();

router.post("/send", async (req, res) => {
  try {
    let customers = [];

    if (req.body.folderId) {
      console.log("📁 folderId detected:", req.body.folderId);

      customers = await Customer.find({ folder: req.body.folderId });
    } else if (Array.isArray(req.body.customerIds)) {
      console.log("🧑‍🤝‍🧑 customerIds detected:", req.body.customerIds);
      customers = await Customer.find({ _id: { $in: req.body.customerIds } });
    } else {
      return res.status(400).json({ error: "Provide folderId or customerIds" });
    }

    const messageBody = req.body.message;
    if (!messageBody) {
      console.log("❌ No message provided");
      return res.status(400).json({ error: "message required" });
    }

    const validCustomers = customers.filter((c) => c.mobileE164);
    const invalidCount = customers.length - validCustomers.length;
    const results = await Promise.all(
      validCustomers.map(async (c) => {
        const logs = [];
        try {
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
          const wa = await client.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${c.mobileE164}`,
            contentSid: MESSAGE_CONTENT_SID,
            contentVariables: JSON.stringify({
              1: "https://forms.gle/wBtEqKEeASoZe2PD6",
            }),
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
        await MessageLog.insertMany(logs);
        return { customerId: c._id, mobile: c.mobileE164, logs };
      }),
    );

    console.log("🎉 All messaging completed!");
    console.log("Final result:", results);

    res.json({ success: true, sentTo: results.length, invalidCount, results });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
