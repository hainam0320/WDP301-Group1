const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientModel'
    },
    recipientModel: {
        type: String,
        required: true,
        enum: ['User', 'Driver']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['ORDER_ACCEPTED', 'REPORT_UPDATED', 'GENERAL'],
        required: true
    }
}, {
    timestamps: true
});

notificationSchema.index({ recipient: 1, recipientModel: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 