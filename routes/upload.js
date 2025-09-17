const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const User = require("../models/User");
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    // Format & save to DB
    const users = sheet.map((row) => ({
      name: row["Name :"], // matches your header exactly
      phone: row["CONTACT"], // matches all caps
      product: row["Product :"],
      DOE: row["DOE :"]?.toString().trim(),
    }));
    await User.insertMany(users); // bulk insert for speed
    res.json({ message: "File uploaded & data saved successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
