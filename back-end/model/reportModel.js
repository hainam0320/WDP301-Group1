const { default: mongoose } = require("mongoose");

const reportSchema = new mongoose.Schema({
    reporterID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    reported_user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Driver', 
        required: true 
    },
    order_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true 
    },
    type: { 
        type: String, 
        required: true,
        enum: ['late', 'damage', 'lost', 'inappropriate', 'fraud', 'other']
    },
    description: { 
        type: String, 
        required: true 
    },
    image: { 
        type: String, // URL/path to the image
        default: ''
    },
    admin_note: { 
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true // adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Report', reportSchema);