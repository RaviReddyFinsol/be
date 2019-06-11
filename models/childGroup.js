const mongoose = require("mongoose");

const childGroupSchema = mongoose.Schema({
  childGroupName: { type: String, unique: true, required: true },
  subGroup: { type: String, required: true },
  imagePath: { type: String, required: false },
  user: { type: String, required: true },
  isEditable: { type: Boolean, required: false }
});

module.exports = mongoose.model("ChildGroup", childGroupSchema);
