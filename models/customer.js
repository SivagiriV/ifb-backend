const mongoose = require("mongoose");
const CustomerSchema = new mongoose.Schema({
  name: String,
  productName: String,
  mobile: String,
  mobileE164: String,
  dateEnding: Date,
  folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },
  uploadedAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed,
});
module.exports = mongoose.model("Customer", CustomerSchema);
