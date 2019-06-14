const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const childGroupSchema = mongoose.Schema({
  childGroupName: { type: String, unique: true, required: true },
  subGroup: { type: Schema.Types.ObjectId, ref: "SubGroup",  required: true },
  imagePath: { type: String, required: false },
  user: { type: String, required: true },
  isEditable: { type: Boolean, required: false },
  subGroupName : {type:String,required:false}
  
});

module.exports = mongoose.model("ChildGroup", childGroupSchema);
