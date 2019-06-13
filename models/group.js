const mongoose = require("mongoose");

const groupSchema = mongoose.Schema({
  groupName: { type: String, required: true, unique: true },
  imagePath: { type: String, required: false },
  user: { type: String, required: true },
  isEditable: { type: Boolean, required: false }  
});

module.exports = mongoose.model("Group", groupSchema);
