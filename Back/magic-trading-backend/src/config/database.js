const { MongoClient } = require('mongodb');
require('dotenv').config();

class DatabaseConnection {
    constructor() {
        this.client = null;
        this.db = null;
        this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        this.dbName = 'magic_trading';
    }

    async connect() {
        try {
            this.client = new MongoClient(this.uri);
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            console.log('Conectado a MongoDB');
            return this.db;
        } catch (err) {
            console.error('Error conectando a MongoDB:', err);
            process.exit(1);
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('Conexión a MongoDB cerrada');
        }
    }
}

module.exports = new DatabaseConnection();
