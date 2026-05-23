const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
    color: String,
    image: String,
    price: Number,
    originalPrice: Number
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    category: {
        type: String,
        default: 'Uncategorized'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    },
    variants: {
        type: [VariantSchema],
        default: []
    },
    stock: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
