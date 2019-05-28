const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  remedyName: { type: String, required: true },
  remedyType: { type: String, required: true },
  remedyForGender: { type: String, required: true },
  age: { type: String, required: true },
  bodyPart: { type: String, required: true },
  timeToUse: { type: String, required: true },
  videoLink: { type: String, required: false },
  ingridients: { type: String, required: true },
  stepDesciption: { type: Array, required: true },
  stepFilePaths: { type: Array, required }
});

module.exports = mongoose.model("User", userSchema);
