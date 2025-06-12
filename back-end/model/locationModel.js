const {default: mongoose, Schema} = require("mongoose");
const locationSchema = new mongoose.Schema({
    userid:{type:Schema.Types.ObjectId, ref: 'User', required: true},
    name:{type: String, required: true},
    address:{type: String, required: true},
    latling:{type: String, required: true},

});

module.exports = mongoose.model('Location', locationSchema);