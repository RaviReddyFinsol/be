const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subGroupSchema = mongoose.Schema({
  subGroupName: { type: String, required: true, unique: true },
  group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  imagePath: { type: String, required: false },
  user: { type: String, required: true },
  isEditable: { type: Boolean, required: false },
  groupName : {type:String,required:false}
});

module.exports = mongoose.model("SubGroup", subGroupSchema);
