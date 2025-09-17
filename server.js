require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const uploadRoute = require("./routes/upload");
const userRoute = require("./routes/user");
const startScheduler = require("./routes/scheduler");
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    startScheduler();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/upload", uploadRoute);
app.use("/users", userRoute);

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
