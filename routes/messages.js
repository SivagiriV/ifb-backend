const express = require("express");
const twilio = require("twilio");
const Customer = require("../models/customer");
const MessageLog = require("../models/messageLog");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_FROM = process.env.TWILIO_PHONE;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

const router = express.Router();

router.post("/send", async (req, res) => {
  console.log("📩 /send API called");
  console.log("Request body:", req.body);

  try {
    let customers = [];

    if (req.body.folderId) {
      console.log("📁 folderId detected:", req.body.folderId);

      customers = await Customer.find({ folder: req.body.folderId });
      console.log("Customers fetched by folder:", customers.length);
    } else if (Array.isArray(req.body.customerIds)) {
      console.log("🧑‍🤝‍🧑 customerIds detected:", req.body.customerIds);

      customers = await Customer.find({ _id: { $in: req.body.customerIds } });
      console.log("Customers fetched by IDs:", customers.length);
    } else {
      console.log("❌ No customerIds or folderId provided");
      return res.status(400).json({ error: "Provide folderId or customerIds" });
    }

    const messageBody = req.body.message;
    if (!messageBody) {
      console.log("❌ No message provided");
      return res.status(400).json({ error: "message required" });
    }

    console.log("Message to be sent:", messageBody);

    const validCustomers = customers.filter((c) => c.mobileE164);
    const invalidCount = customers.length - validCustomers.length;

    console.log("Valid numbers:", validCustomers.length);
    console.log("Invalid numbers skipped:", invalidCount);

    const results = await Promise.all(
      validCustomers.map(async (c) => {
        console.log(
          `\n🚀 Processing customer: ${c._id}, Mobile: ${c.mobileE164}`
        );

        const logs = [];

        // --- SEND SMS ---
        try {
          console.log(`📤 Sending SMS to ${c.mobileE164}...`);

          const sms = await client.messages.create({
            body: messageBody,
            from: TWILIO_FROM,
            to: c.mobileE164,
          });

          console.log("✅ SMS sent:", sms.sid, "Status:", sms.status);

          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "sms",
            status: sms.status,
            twilioSid: sms.sid,
            body: messageBody,
          });
        } catch (smsErr) {
          console.error("❌ SMS FAILED for", c.mobileE164, smsErr);

          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "sms",
            status: "failed",
            twilioSid: null,
            body: messageBody,
          });
        }

        // --- SEND WHATSAPP ---
        try {
          console.log(`📤 Sending WhatsApp to whatsapp:${c.mobileE164}...`);

          const wa = await client.messages.create({
            body: messageBody,
            from: TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${c.mobileE164}`,
          });

          console.log("✅ WhatsApp sent:", wa.sid, "Status:", wa.status);

          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "whatsapp",
            status: wa.status,
            twilioSid: wa.sid,
            body: messageBody,
          });
        } catch (waErr) {
          console.error("❌ WHATSAPP FAILED for", c.mobileE164, waErr);

          logs.push({
            customer: c._id,
            to: c.mobileE164,
            channel: "whatsapp",
            status: "failed",
            twilioSid: null,
            body: messageBody,
          });
        }

        console.log("📝 Saving logs to DB...");
        await MessageLog.insertMany(logs);
        console.log("✅ Logs saved for", c.mobileE164);

        return { customerId: c._id, mobile: c.mobileE164, logs };
      })
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
