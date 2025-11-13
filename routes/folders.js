const express = require("express");
const Folder = require("../models/folder");
const Customer = require("../models/customer");
const router = express.Router();

router.get("/", async (req, res) => {
  // get all folders with counts
  const folders = await Folder.find().lean();
  const counts = await Customer.aggregate([
    { $group: { _id: "$folder", count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  const result = folders.map((f) => ({
    ...f,
    count: map.get(String(f._id)) || 0,
  }));
  res.json(result);
});

router.get("/:folderId/customers", async (req, res) => {
  const { folderId } = req.params;
  const customers = await Customer.find({ folder: folderId }).lean();
  res.json(customers);
});

module.exports = router;
