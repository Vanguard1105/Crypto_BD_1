const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://vanguard951105:F0Y7B0MtjvH1OFbL@cluster0.haemz.mongodb.net/";
const client = new MongoClient(uri);

let dbConnection;

const connectToDatabase = async () => {
  try {
    const connection = await client.connect();
    dbConnection = connection.db('solana');
    console.log('Successfully connected to MongoDB');
  } catch (err) {
    console.error('Connection to MongoDB failed', err);
    process.exit(1);
  }
};

const getDb = () => {
  if (!dbConnection) {
    throw new Error('No database connection');
  }
  return dbConnection;
};

module.exports = { connectToDatabase, getDb };