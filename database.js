const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://trendytreasure0813:myfavonefaye@cluster0.7ocftp3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let client;
let db;

const connectDB = async () => {
    try {
        if (!client) {
            client = new MongoClient(uri);
            await client.connect();
            db = client.db('trendytreasure');
            console.log('Connected to MongoDB Atlas');
        }
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB connection closed');
    }
};

module.exports = { connectDB, getDB, closeDB };