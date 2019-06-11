const mongoose = require("mongoose");

const subGroupSchema = mongoose.Schema({
  subGroupName: { type: String, required: true, unique: true },
  group: { type: String, required: true },
  imagePath: { type: String, required: false },
  user: { type: String, required: true },
  isEditable: { type: Boolean, required: false }
});

module.exports = mongoose.model("SubGroup", subGroupSchema);
