const { default: mongoose } = require("mongoose");

const deliveryItemSchema = new mongoose.Schema({
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    weight_kg: { 
        type: Number, 
        required: true 
    },
    fragile: { 
        type: Boolean, 
        default: false 
    },
    note: { 
        type: String 
    }
}, {
    timestamps: true // optional: adds createdAt and updatedAt fields
});

module.exports = mongoose.model('DeliveryItem', deliveryItemSchema);