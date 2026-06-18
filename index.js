require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.port || "3000";

// root api
app.get("/", async (req, res) => {
  try {
    res.send(`Welcome to RentBari Server`);
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`RentBari server is running on port ${port}`);
});
