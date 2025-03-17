const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  try {
    await client.connect();
    const db = client.db('solana');
    cachedClient = client;
    cachedDb = db;
    console.log('Successfully connected to MongoDB');
    return { client, db };
  } catch (err) {
    console.error('Connection to MongoDB failed', err);
    throw err;
  }
};

const getDb = async () => {
  if (!cachedDb) {
    await connectToDatabase();
  }
  return cachedDb;
};

module.exports = { connectToDatabase, getDb };