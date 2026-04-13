const mongoose = require('mongoose');
const requireEnv = require('../utils/requireEnv.util');

const mongodbUri = requireEnv('MONGODB_URI');

async function connectDB() {
    try {
        await mongoose.connect(mongodbUri);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        process.exit(1);
    }
}

module.exports = connectDB;
