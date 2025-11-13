const mongoose = require("mongoose");
const CustomerSchema = new mongoose.Schema({
  Name: String,
  Product: String,
  Contact: String,
  mobileE164: String,
  DOE: Date,
  folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },
  uploadedAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed,
});
module.exports = mongoose.model("Customer", CustomerSchema);
