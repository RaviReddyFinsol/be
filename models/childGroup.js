const mongoose = require("mongoose");

const childGroupSchema = mongoose.Schema({
  childGroupName: { type: String, unique: true, required: true },
  groupName: { type: String, required: true }
});

module.exports = mongoose.model("ChildGroup", childGroupSchema);
