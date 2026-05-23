const http = require('http');
const url = require('url');
require('dotenv').config();
const { connectDB } = require('./utils/database');
const { sendError, sendJSON } = require('./utils/responseHelper');
const { registerUser, loginUser, getAllUsers } = require('./utils/userController');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('./utils/productController');
const { addToCart, getCart } = require('./utils/cartController');
const { createOrder, getOrders } = require('./utils/orderController');
const { verifyToken } = require('./utils/authHelper');
const { createOrder: createRazorpayOrder, verifyPayment } = require('./utils/razorpayController');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
    // Logging incoming requests
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle Preflight Request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Authentication Middleware
    const authenticate = (req) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.split(' ')[1];
        return verifyToken(token);
    };

    const normalizedPath = path.toLowerCase().replace(/\/$/, '');
    const normalizedMethod = method.toUpperCase();

    // Route: /register
    if (normalizedPath === '/register' && normalizedMethod === 'POST') {
        return registerUser(req, res);
    }

    // Route: /login
    if (normalizedPath === '/login' && normalizedMethod === 'POST') {
        return loginUser(req, res);
    }

    // Route: /users
    if (normalizedPath === '/users' && normalizedMethod === 'GET') {
        req.user = authenticate(req);
        return getAllUsers(req, res);
    }

    // Route: /products
    if (normalizedPath === '/products') {
        if (normalizedMethod === 'GET') return getAllProducts(req, res);
        if (normalizedMethod === 'POST') {
            req.user = authenticate(req);
            if (!req.user) return sendError(res, 401, 'Unauthorized');
            return createProduct(req, res);
        }
    }

    // Route: /products/:id
    if (normalizedPath.startsWith('/products/')) {
        const id = normalizedPath.split('/')[2];
        if (id) {
            if (normalizedMethod === 'GET') return getProductById(req, res, id);
            if (normalizedMethod === 'PUT') {
                req.user = authenticate(req);
                if (!req.user) return sendError(res, 401, 'Unauthorized');
                return updateProduct(req, res, id);
            }
            if (normalizedMethod === 'DELETE') {
                req.user = authenticate(req);
                if (!req.user) return sendError(res, 401, 'Unauthorized');
                return deleteProduct(req, res, id);
            }
        }
    }

    // Route: /cart
    if (normalizedPath === '/cart') {
        req.user = authenticate(req);
        if (!req.user) return sendError(res, 401, 'Unauthorized');

        if (normalizedMethod === 'GET') return getCart(req, res);
        if (normalizedMethod === 'POST') return addToCart(req, res);
    }

    // Route: /orders
    if (normalizedPath === '/orders') {
        req.user = authenticate(req);
        if (!req.user) return sendError(res, 401, 'Unauthorized');

        if (normalizedMethod === 'GET') return getOrders(req, res);
        if (normalizedMethod === 'POST') return createOrder(req, res);
    }

    // Route: /api/create-order (Razorpay)
    if ((normalizedPath === '/api/create-order' || normalizedPath === '/create-order') && normalizedMethod === 'POST') {
        return createRazorpayOrder(req, res);
    }

    // Route: /api/verify-payment (Razorpay)
    if ((normalizedPath === '/api/verify-payment' || normalizedPath === '/verify-payment') && normalizedMethod === 'POST') {
        return verifyPayment(req, res);
    }

    // Health Check
    if (normalizedPath === '/api/health' || normalizedPath === '/health') {
        return sendJSON(res, 200, { status: 'ok', time: new Date().toISOString() });
    }

    // 404 Route Not Found
    sendError(res, 404, `Route ${normalizedMethod} ${normalizedPath} not found`);
});

// Connect to Database and start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});
