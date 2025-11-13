const mongoose = require("mongoose");
const MessageLogSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  to: String,
  channel: { type: String, enum: ["sms", "whatsapp"] },
  body: String,
  status: String,
  twilioSid: String,
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("MessageLog", MessageLogSchema);
