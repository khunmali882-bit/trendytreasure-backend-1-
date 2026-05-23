const Product = require('../models/Product');
const { sendJSON, sendError, getRequestBody } = require('./responseHelper');
const crypto = require('crypto');

const getAllProducts = async (req, res) => {
    try {
        const parsedUrl = require('url').parse(req.url, true);
        const search = parsedUrl.query.search;
        const category = parsedUrl.query.category;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = { $regex: new RegExp('^' + category + '$', 'i') };
        }

        const products = await Product.find(query, '-_id -__v');
        sendJSON(res, 200, products);
    } catch (error) {
        console.error('Get All Products Error:', error);
        sendError(res, 500, 'Error fetching products');
    }
};

const getProductById = async (req, res, id) => {
    try {
        const product = await Product.findOne({ id }, '-_id -__v');

        if (!product) {
            return sendError(res, 404, 'Product not found');
        }
        sendJSON(res, 200, product);
    } catch (error) {
        console.error('Get Product By ID Error:', error);
        sendError(res, 500, 'Error fetching product');
    }
};

const createProduct = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { name, description, price, category, imageUrl, stock, originalPrice, images, variants } = body;

        if (!name || price === undefined) {
            return sendError(res, 400, 'Name and price are required');
        }

        const newProduct = new Product({
            id: crypto.randomUUID(),
            name,
            description: description || '',
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : Number(price),
            category: category || 'Uncategorized',
            imageUrl: imageUrl || '',
            images: images || [],
            variants: variants || [],
            stock: stock !== undefined ? Number(stock) : 50
        });

        await newProduct.save();
        
        const productObj = newProduct.toObject();
        delete productObj._id;
        delete productObj.__v;
        
        sendJSON(res, 201, productObj);
    } catch (error) {
        console.error('Create Product Error:', error);
        sendError(res, 500, 'Error creating product');
    }
};

const updateProduct = async (req, res, id) => {
    try {
        const body = await getRequestBody(req);
        
        // Remove id and database fields from body update to prevent overwriting
        delete body.id;
        delete body._id;
        delete body.__v;

        const updatedProduct = await Product.findOneAndUpdate(
            { id },
            { $set: body },
            { new: true, fields: '-_id -__v' }
        );

        if (!updatedProduct) {
            return sendError(res, 404, 'Product not found');
        }

        sendJSON(res, 200, updatedProduct);
    } catch (error) {
        console.error('Update Product Error:', error);
        sendError(res, 500, 'Error updating product');
    }
};

const deleteProduct = async (req, res, id) => {
    try {
        const deletedProduct = await Product.findOneAndDelete({ id });

        if (!deletedProduct) {
            return sendError(res, 404, 'Product not found');
        }

        sendJSON(res, 200, { message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        sendError(res, 500, 'Error deleting product');
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
