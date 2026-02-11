const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cropName: {
        type: String,
        required: [true, 'Crop name is required'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0
    },
    unit: {
        type: String,
        enum: ['kg', 'quintal', 'ton', 'pieces', 'dozen'],
        default: 'kg'
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['available', 'sold'],
        default: 'available'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for search functionality
listingSchema.index({ cropName: 'text', location: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
