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
        type: String,
        default: '',
        get: function(v) {
            if (!v) return [];
            return Array.isArray(v) ? v : v.split(',').filter(img => img.trim());
        },
        set: function(v) {
            if (!v) return '';
            return Array.isArray(v) ? v.join(',') : v;
        }
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
    timestamps: true, // adds createdAt and updatedAt fields
    toJSON: { getters: true }, // Enable getters when converting to JSON
    toObject: { getters: true } // Enable getters when converting to object
});

module.exports = mongoose.model('Report', reportSchema);