const express = require('express');
const axios = require('axios');
const PriceData = require('../models/PriceData');
const router = express.Router();

// Constants for data points
const MAX_POINTS = {
  ms: 1200,    // 1200 points for ms (10 minutes at 500ms intervals)
  '5m': 300,   // 300 points for 5 minutes
  '1h': 360,   // 360 points for 1 hour
  '1d': 288,   // 288 points for 1 day
  '7d': 336,   // 336 points for 7 days
};

// Fetch current Solana price with retry logic
const fetchSolanaPrice = async (retryCount = 0) => {
  try {
    const response = await axios.get('https://api.coinbase.com/v2/prices/SOL-USD/spot', {
      timeout: 2000
    });
    return parseFloat(response.data.data.amount);
  } catch (error) {
    console.error('Error fetching Solana price:', error);
    if (retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchSolanaPrice(retryCount + 1);
    }
    return null;
  }
};

// Update price history in MongoDB
const updatePriceHistory = async () => {
  const newPrice = await fetchSolanaPrice();
  if (newPrice === null) return;

  const now = new Date();

  // Helper function to update a period
  const updatePeriod = async (period, interval) => {
    const lastUpdate = await PriceData.findOne({ period })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!lastUpdate || now - lastUpdate.timestamp >= interval) {
      const average = await calculateAverage(period, newPrice);
      
      await PriceData.create({
        period,
        timestamp: now,
        price: newPrice,
        average
      });

      // Remove old data points
      const count = await PriceData.countDocuments({ period });
      if (count > MAX_POINTS[period]) {
        const oldest = await PriceData.find({ period })
          .sort({ timestamp: 1 })
          .limit(count - MAX_POINTS[period]);
        
        await PriceData.deleteMany({ 
          _id: { $in: oldest.map(doc => doc._id) }
        });
      }
    }
  };

  // Update all periods
  await Promise.all([
    updatePeriod('ms', 500),
    updatePeriod('5m', 1000),
    updatePeriod('1h', 10000),
    updatePeriod('1d', 300000),
    updatePeriod('7d', 1800000)
  ]);
};

// Calculate average for a period
const calculateAverage = async (period, newPrice) => {
  const data = await PriceData.find({ period });
  const sum = data.reduce((acc, point) => acc + point.price, newPrice);
  return sum / (data.length + 1);
};

// Get price history
router.get('/history', async (req, res) => {
  try {
    const periods = ['ms', '5m', '1h', '1d', '7d'];
    const history = {};

    for (const period of periods) {
      const data = await PriceData.find({ period })
        .sort({ timestamp: -1 })
        .limit(MAX_POINTS[period]);
      
      history[period] = data.reverse();
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Start updating price history every 500ms
setInterval(updatePriceHistory, 500);

module.exports = router;