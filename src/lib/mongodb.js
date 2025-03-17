const { MongoClient } = require('mongodb');
require('dotenv').config(); // Add this line to load .env file

const uri = process.env.MONGODB_URI; // Use environment variable
const client = new MongoClient(uri);

let dbConnection;
let connectionPromise;

const connectToDatabase = async () => {
  if (!connectionPromise) {
    connectionPromise = client.connect()
      .then(connection => {
        dbConnection = connection.db('solana');
        console.log('Successfully connected to MongoDB');
        return dbConnection;
      })
      .catch(err => {
        console.error('Connection to MongoDB failed', err);
        process.exit(1);
      });
  }
  return connectionPromise;
};

const getDb = async () => {
  if (!dbConnection) {
    await connectToDatabase();
  }
  return dbConnection;
};

module.exports = { connectToDatabase, getDb };