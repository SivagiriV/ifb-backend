const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const Folder = require("../models/folder");
const Customer = require("../models/customer");
const { parsePhoneToE164 } = require("../utils/phones");

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { folderName } = req.body;
    if (!folderName)
      return res.status(400).json({ error: "folderName required" });

    let folder = await Folder.findOne({ name: folderName });
    if (!folder) folder = await Folder.create({ name: folderName });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    /** ---------------- HEADER MAPPING ---------------- */
    const headerMap = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const key = cell.text.toString().trim().toLowerCase().replace(/\s+/g, "");

      headerMap[key] = colNumber;
    });

    // Required headers
    const nameCol = headerMap["name"];
    const productCol = headerMap["product"];
    const contactCol = headerMap["contact"] || headerMap["mobilen"];
    const doeCol = headerMap["doe"];

    if (!nameCol || !contactCol) {
      return res.status(400).json({
        error: "Excel must contain Name and Contact/MOBILE N columns",
      });
    }

    /** ---------------- ROW PARSING ---------------- */
    const rows = [];

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row || row.actualCellCount === 0) continue;

      const name = row.getCell(nameCol)?.text?.trim();
      const productName = productCol
        ? row.getCell(productCol)?.text?.trim()
        : "";

      const mobile = row.getCell(contactCol)?.text?.trim();
      if (!name || !mobile) continue;

      const doeRaw = doeCol ? row.getCell(doeCol).value : null;

      let dateEnding = null;
      if (doeRaw instanceof Date) {
        dateEnding = doeRaw;
      } else if (typeof doeRaw === "number") {
        dateEnding = new Date(Math.round((doeRaw - 25569) * 86400 * 1000));
      }

      rows.push({
        Name: name,
        Product: productName,
        Contact: mobile,
        mobileE164: parsePhoneToE164(mobile),
        DOE: dateEnding,
        folder: folder._id,
      });
    }

    /** ---------------- INSERT ---------------- */
    if (!rows.length) {
      return res.status(400).json({ error: "No valid rows found" });
    }

    await Customer.insertMany(rows, { ordered: false });

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
