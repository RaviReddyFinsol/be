const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/users");
const catogeryRoutes = require("./routes/groups");
const { dbConnection } = require("./config");

const app = express();

mongoose
  .connect(dbConnection, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to database!");
  })
  .catch(err => {
    console.log("Connection failed!", err);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/api/user", userRoutes);

app.use("/api/remedies", userRoutes);

app.use("/api/catogery", catogeryRoutes);

module.exports = app;
