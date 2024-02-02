const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName:{
    type:String,
    required:true
},
lastName:{
    type:String,
    required:true 
},

email:{
    type:String,
    required:true
},
mobile:{
    type:Number,
    required:true
},
password:{
    type:String,
    required:true
},
isVerified:{
    type:Boolean,
    default: false
},

  isBlock: {
    type: Boolean,
    default: false
  }
}, {
  // timestamps: true
});

module.exports = mongoose.model('user', userSchema);
