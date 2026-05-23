const User = require('../models/User');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');
const { hashPassword, verifyPassword, generateToken } = require('./authHelper');
const { isValidEmail, isValidPassword } = require('./validationHelper');
const crypto = require('crypto');

const registerUser = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { name, password } = body;
        const email = body.email ? body.email.trim().toLowerCase() : '';

        if (!name || !email || !password) {
            return sendError(res, 400, 'Name, email, and password are required');
        }

        if (!isValidEmail(email)) {
            return sendError(res, 400, 'Invalid email format');
        }

        if (!isValidPassword(password)) {
            return sendError(res, 400, 'Password must be at least 6 characters');
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendError(res, 409, 'User already exists');
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            id: crypto.randomUUID(),
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const userObj = newUser.toObject();
        delete userObj.password;
        delete userObj._id;
        delete userObj.__v;

        sendJSON(res, 201, { message: 'User registered successfully', user: userObj });

    } catch (error) {
        console.error('Registration Error:', error);
        sendError(res, 500, 'Internal Server Error');
    }
};

const loginUser = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const email = body.email ? body.email.trim().toLowerCase() : '';
        const password = body.password ? body.password.trim() : '';

        if (!email || !password) {
            return sendError(res, 400, 'Email and password are required');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return sendError(res, 401, 'Invalid credentials');
        }

        const isMatch = await verifyPassword(user.password, password);
        if (!isMatch) {
            return sendError(res, 401, 'Invalid credentials');
        }

        const token = generateToken(user);

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj._id;
        delete userObj.__v;

        sendJSON(res, 200, { message: 'Login successful', token, user: userObj });

    } catch (error) {
        console.error('Login Error:', error);
        sendError(res, 500, 'Internal Server Error');
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password -_id -__v');
        sendJSON(res, 200, users);
    } catch (error) {
        console.error('Get All Users Error:', error);
        sendError(res, 500, 'Internal Server Error');
    }
};

module.exports = { registerUser, loginUser, getAllUsers };
