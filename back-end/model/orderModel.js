const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  driverId:     { type: Schema.Types.ObjectId, ref: 'Driver' },
  type:         { type: String, enum: ['order','delivery'], default: 'order', required: true },
  phone:        { type: String, required: true },
  pickupaddress:{ type: String, required: true },
  dropupaddress:{ type: String, required: true },
  timeStart:    { type: String, required: true },
  timeEnd:      { type: String },
  price:        { type: Number, required: true },
  status:       { type: String, required: true },
  statusDescription: { type: String },
  distance_km:  { type: Number, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
