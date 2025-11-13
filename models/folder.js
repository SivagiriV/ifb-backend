const mongoose = require("mongoose");
const FolderSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Folder", FolderSchema);
