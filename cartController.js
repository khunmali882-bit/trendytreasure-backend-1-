const Cart = require('../models/Cart');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');

const getCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        let userCart = await Cart.findOne({ userId: user.id }, '-_id -__v');
        if (!userCart) {
            userCart = { userId: user.id, items: [] };
        }

        sendJSON(res, 200, userCart);
    } catch (error) {
        console.error('Get Cart Error:', error);
        sendError(res, 500, 'Error fetching cart');
    }
};

const addToCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return sendError(res, 401, 'Unauthorized');

        const body = await getRequestBody(req);
        const { productId, quantity } = body;

        if (!productId || quantity === undefined) {
            return sendError(res, 400, 'ProductId and quantity required');
        }

        let userCart = await Cart.findOne({ userId: user.id });

        if (!userCart) {
            // Create new cart if quantity is positive
            if (Number(quantity) > 0) {
                userCart = new Cart({ userId: user.id, items: [{ productId, quantity: Number(quantity) }] });
                await userCart.save();
            } else {
                userCart = { userId: user.id, items: [] };
            }
        } else {
            // Update existing cart
            const itemIndex = userCart.items.findIndex(i => i.productId === productId);

            if (itemIndex > -1) {
                userCart.items[itemIndex].quantity += Number(quantity);
                if (userCart.items[itemIndex].quantity <= 0) {
                    userCart.items.splice(itemIndex, 1);
                }
            } else if (Number(quantity) > 0) {
                userCart.items.push({ productId, quantity: Number(quantity) });
            }

            await userCart.save();
        }

        const cartObj = (userCart.toObject && typeof userCart.toObject === 'function') ? userCart.toObject() : userCart;
        delete cartObj._id;
        delete cartObj.__v;

        sendJSON(res, 200, cartObj);
    } catch (error) {
        console.error('Add To Cart Error:', error);
        sendError(res, 500, 'Error updating cart');
    }
};

module.exports = { getCart, addToCart };
