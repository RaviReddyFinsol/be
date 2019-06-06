const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const subGroupRoutes = require("./routes/subGroups");
const childGroupRoutes = require("./routes/childGroups");
const productRoutes = require("./routes/products");
const catogeryRoutes = require("./routes/catogery");
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

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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

app.use("/api/catogery", catogeryRoutes);

app.use("/api/groups", groupRoutes);

app.use("/api/subGroups", subGroupRoutes);

app.use("/api/childGroups", childGroupRoutes);

app.use("/api/products", productRoutes);

module.exports = app;
