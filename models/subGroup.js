const mongoose = require("mongoose");

const subGroupSchema = mongoose.Schema({
  subGroupName: { type: String, required: true, unique: true },
  groupName: { type: String, required: true },
  imagePath: { type: String, required: false },
  user: { type: String, required: true },
  isEditable: { type: Boolean, required: false }
});

module.exports = mongoose.model("SubGroup", subGroupSchema);
