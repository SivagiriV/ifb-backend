const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  product: String,
  DOE: String, // store as string "DD.MM.YYYY"
});

module.exports = mongoose.model("User", userSchema);
