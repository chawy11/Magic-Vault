require('dotenv').config();

// Validate required environment variables
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
}

module.exports = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'secreto_temporal_ONLY_FOR_DEVELOPMENT',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    environment: process.env.NODE_ENV || 'development'
};
