const express = require('express');
const axios = require('axios');
const router = express.Router();

// In-memory storage for price history
const priceHistory = {
  ms: [],      // Real-time data (500ms interval)
  '5m': [],    // Average data (1 second interval)
  '1h': [],    // Average data (10 seconds interval)
  '1d': [],    // Average data (5 minutes interval)
  '7d': [],    // Average data (30 minutes interval)
};

// Constants for max data points
const MAX_POINTS = {
  ms: 300,     // 300 points for ms (2.5 minutes at 500ms intervals)
  '5m': 300,   // 300 points for 5 minutes
  '1h': 360,   // 360 points for 1 hour
  '1d': 288,   // 288 points for 1 day
  '7d': 336,   // 336 points for 7 days
};

// Function to print ms price every second
const printMsPrice = () => {
  if (priceHistory.ms.length > 0) {
    const latestPrice = priceHistory.ms[priceHistory.ms.length - 1];
    console.log(`[${new Date().toISOString()}] MS Price: $${latestPrice.price.toFixed(2)}`);
  }
};

// Start printing ms price every second
setInterval(printMsPrice, 1000);

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

// Update price history
const updatePriceHistory = async () => {
  const newPrice = await fetchSolanaPrice();
  if (newPrice === null) return;

  const now = Date.now();

  // Update ms history (real-time data, 500ms interval)
  if (priceHistory.ms.length === 0 || now - priceHistory.ms[priceHistory.ms.length - 1].timestamp >= 500) {
    priceHistory.ms.push({
      timestamp: now,
      price: newPrice,
      average: newPrice // For ms, average is same as price
    });
    
    // Maintain exactly 300 data points
    if (priceHistory.ms.length > MAX_POINTS.ms) {
      priceHistory.ms.shift();
    }
  }

  // Helper function to update average periods
  const updateAveragePeriod = (period, interval, maxPoints) => {
    if (priceHistory[period].length === 0 || 
        now - priceHistory[period][priceHistory[period].length - 1].timestamp >= interval) {
      
      // Calculate new average
      const previousPrices = priceHistory[period].slice(-maxPoints);
      const sum = previousPrices.reduce((acc, point) => acc + point.average, newPrice);
      const count = previousPrices.length + 1;
      const newAverage = sum / count;

      priceHistory[period].push({
        timestamp: now,
        price: newPrice,       // Keep the actual price for reference
        average: newAverage    // Store the calculated average
      });

      // Keep only the last maxPoints
      if (priceHistory[period].length > maxPoints) {
        priceHistory[period].shift();
      }
    }
  };

  // Update average periods
  updateAveragePeriod('5m', 1000, MAX_POINTS['5m']);
  updateAveragePeriod('1h', 10000, MAX_POINTS['1h']);
  updateAveragePeriod('1d', 300000, MAX_POINTS['1d']);
  updateAveragePeriod('7d', 1800000, MAX_POINTS['7d']);
};

// Start updating price history every 500ms
setInterval(updatePriceHistory, 500);

// Endpoint to get price history
router.get('/history', (req, res) => {
  res.json(priceHistory);
});

module.exports = router;