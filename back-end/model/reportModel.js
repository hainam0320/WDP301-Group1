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
        enum: ['spam', 'inappropriate', 'fraud', 'other'] // example types, adjust as needed
    },
    description: { 
        type: String, 
        required: true 
    },
    image: { 
        type: String // assuming this is a URL/path to the image
    },
    admin_note: { 
        type: String 
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