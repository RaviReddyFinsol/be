const moongoose = require("mongoose");

const productSchema = moongoose.Schema({
  user : {type : String,required : false},
  productName: { type: String, required: true },
  path: { type: String, required: true },
  dietType: { type: String, required: false },
  brand: { type: String, required: true },
  description: { type: String, required: false },
  ingridients: { type: String, required: false },
  healthBenifits: { type: String, required: false },
  validity: { type: String, required: false },
  manufactureDetails: { type: String, required: false },
  sellerDetails: { type: String, required: false },
  images : [{
    imagePath: { type: String, required: false },
  }],
  productQtyDetails: [
    {
      mrp: { type: Number, required: true },
      sellPrice: { type: Number, required: true },
      discount: { type: Number, required: true },
      offer: { type: String, required: true },
      availableQuantity: { type: String, required: true }
    }
  ]
});

module.exports = moongoose.model("Product", productSchema);
