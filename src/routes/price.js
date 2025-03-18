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

// // Function to print ms price every second
// const printMsPrice = () => {
//   if (priceHistory.ms.length > 0) {
//     const latestPrice = priceHistory.ms[priceHistory.ms.length - 1];
//     console.log(`[${new Date().toISOString()}] MS Price: $${priceHistory.ms.length}`);
//   }
// };

// // Start printing ms price every second
// setInterval(printMsPrice, 1000);

// Fetch current Solana price with retry logic
const fetchSolanaPrice = async (retryCount = 0) => {
  try {
    const response = await axios.get('https://api.coinbase.com/v2/prices/SOL-USD/spot', {
      timeout: 2000
    });
    return parseFloat(response.data.data.amount);
  } catch (error) {
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
    
    if (priceHistory.ms.length > 1200) {
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
  updateAveragePeriod('5m', 1000, 300);      // 300 points, 1 second interval
  updateAveragePeriod('1h', 10000, 360);     // 360 points, 10 seconds interval
  updateAveragePeriod('1d', 300000, 288);    // 288 points, 5 minutes interval
  updateAveragePeriod('7d', 1800000, 336);   // 336 points, 30 minutes interval
};

// Start updating price history every 500ms
setInterval(updatePriceHistory, 500);

// Endpoint to get price history
router.get('/history', (req, res) => {
  res.json(priceHistory);
});

module.exports = router;