const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');
const crypto = require('crypto');

const getOrders = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        const userOrders = await Order.find({ userId: user.id }, '-_id -__v');
        sendJSON(res, 200, userOrders);
    } catch (error) {
        console.error('Get Orders Error:', error);
        sendError(res, 500, 'Error fetching orders');
    }
};

const createOrder = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        // Fetch user's cart
        const userCart = await Cart.findOne({ userId: user.id });
        if (!userCart || userCart.items.length === 0) {
            return sendError(res, 400, 'Cart is empty');
        }

        // Calculate total and Check Stock
        let total = 0;
        const validItems = [];

        for (const item of userCart.items) {
            const product = await Product.findOne({ id: item.productId });

            if (!product) {
                return sendError(res, 400, `Product ${item.productId} not found`);
            }

            if (product.stock < item.quantity) {
                return sendError(res, 400, `Insufficient stock for ${product.name}`);
            }

            total += product.price * item.quantity;
            validItems.push({ item, product });
        }

        // Deduct Stock
        for (const { item, product } of validItems) {
            product.stock -= item.quantity;
            await product.save();
        }

        const newOrder = new Order({
            id: crypto.randomUUID(),
            userId: user.id,
            items: userCart.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
            status: 'Pending',
            totalAmount: total
        });

        await newOrder.save();

        // Clear cart
        userCart.items = [];
        await userCart.save();

        const orderObj = newOrder.toObject();
        delete orderObj._id;
        delete orderObj.__v;

        sendJSON(res, 201, orderObj);
    } catch (error) {
        console.error('Create Order Error:', error);
        sendError(res, 500, 'Error creating order');
    }
};

module.exports = { getOrders, createOrder };
