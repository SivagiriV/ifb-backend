const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const Folder = require("../models/folder");
const Customer = require("../models/customer");
const { parsePhoneToE164 } = require("../utils/phones");

const upload = multer({ dest: "uploads/" }); // simple; for production store in S3 or persistent storage
const router = express.Router();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { folderName } = req.body;
    if (!folderName)
      return res.status(400).json({ error: "folderName required" });

    // find or create folder
    let folder = await Folder.findOne({ name: folderName });
    if (!folder) folder = await Folder.create({ name: folderName });

    // parse excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    const rows = [];
    // assume header row exists; find columns by header names or fixed positions
    const header = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      header[cell.text.toString().toLowerCase()] = colNumber;
    });

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row) continue;
      const name = row.getCell(header["Name"] || 1).text;
      const productName = row.getCell(header["Product"] || 2).text;
      const mobile = row.getCell(header["Contact"] || 3).text;
      const dateEndingRaw = row.getCell(header["DOE"] || 4).text;
      const dateEnding = dateEndingRaw ? new Date(dateEndingRaw) : null;

      const mobileE164 = parsePhoneToE164(mobile); // util to format

      rows.push({
        Name: name,
        Product: productName,
        Contact: mobile,
        mobileE164,
        DOE: dateEnding,
        folder: folder._id,
      });
    }

    // bulk insert
    await Customer.insertMany(rows);

    return res.json({
      success: true,
      folderId: folder._id,
      inserted: rows.length,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Upload failed", detail: err.message });
  }
});

module.exports = router;
