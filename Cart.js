const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const CartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    items: {
        type: [CartItemSchema],
        default: []
    }
});

module.exports = mongoose.model('Cart', CartSchema);
