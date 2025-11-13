require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const uploadRoutes = require("./routes/upload");
const folderRoutes = require("./routes/folders");
const messageRoutes = require("./routes/messages");

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use("/api/upload", uploadRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/messages", messageRoutes);

app.listen(3000, () => console.log("Listening 3000"));
