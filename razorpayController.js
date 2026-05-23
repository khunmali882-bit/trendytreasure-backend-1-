const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
const createOrder = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { amount, currency = 'INR', receipt } = body;

        // Validate amount (minimum 100 paise = ₹1)
        if (!amount || amount < 100) {
            return sendError(res, 400, 'Amount must be at least 100 paise (₹1)');
        }

        const options = {
            amount: amount, // amount in paise
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        
        sendJSON(res, 200, {
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        const msg = error?.error?.description || error?.message || 'Failed to create order';
        sendError(res, 500, msg);
    }
};

// Verify Payment Signature
const verifyPayment = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        // Check if all required fields are present
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return sendError(res, 400, 'Missing required payment verification fields');
        }

        // Create signature for verification
        const body_string = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body_string.toString())
            .digest('hex');

        // Verify signature
        if (expectedSignature === razorpay_signature) {
            sendJSON(res, 200, {
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            });
        } else {
            sendError(res, 400, 'Payment verification failed - Invalid signature');
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        sendError(res, 500, error.message || 'Payment verification failed');
    }
};

module.exports = {
    createOrder,
    verifyPayment
};