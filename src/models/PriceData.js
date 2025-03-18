const mongoose = require('mongoose');

const priceDataSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true,
    enum: ['ms', '5m', '1h', '1d', '7d']
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  price: {
    type: Number,
    required: true
  },
  average: {
    type: Number,
    required: true
  }
}, {
  collection: 'pricedata' // Explicitly set the collection name
});

// Indexes for faster queries
priceDataSchema.index({ period: 1, timestamp: -1 });

module.exports = mongoose.model('PriceData', priceDataSchema);