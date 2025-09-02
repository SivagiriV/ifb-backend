const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET all users or search by name/address/phone
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};

    if (q) {
      filter = {
        $or: [
          { name: new RegExp(q, "i") },
          { address: new RegExp(q, "i") },
          { phone: new RegExp(q, "i") },
        ],
      };
    }

    const users = await User.find(filter).limit(200); // limit for performance
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
