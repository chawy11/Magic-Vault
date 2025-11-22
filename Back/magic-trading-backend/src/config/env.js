require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'secreto_temporal',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    environment: process.env.NODE_ENV || 'development'
};
