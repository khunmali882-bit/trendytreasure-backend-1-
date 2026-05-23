const mongoose = require('mongoose');
const Product = require('../models/Product');
const fs = require('fs').promises;
const path = require('path');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        await seedProducts();
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

const seedProducts = async () => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            console.log('Product collection is empty. Seeding default products from products.json...');
            const productsPath = path.join(__dirname, '..', 'data', 'products.json');
            const data = await fs.readFile(productsPath, 'utf8');
            const defaultProducts = JSON.parse(data);
            
            // Default stock to 50 for products that do not specify stock
            const cleanedProducts = defaultProducts.map(p => {
                if (p.stock === undefined || p.stock === null) {
                    p.stock = 50;
                }
                return p;
            });

            await Product.insertMany(cleanedProducts);
            console.log(`Seeded ${cleanedProducts.length} products successfully!`);
        }
    } catch (error) {
        console.error('Error seeding products:', error);
    }
};

module.exports = connectDB;
