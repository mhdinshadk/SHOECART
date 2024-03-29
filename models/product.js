const mongoose = require("mongoose")

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true,
      },
      brand: {
        type: String,
        required: true,
      },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      description:{
        type:String,
        required:true
      },
      images: {
        type: Array,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      status: {
        type: Boolean,
        required: true,
        default: true,
      },
      offer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'offer'
      },
       discountedPrice:{
         type:Number
      },
	},
  {
    timestamps:true
  });

module.exports = mongoose.model('product',productSchema)