const express = require('express');
const axios = require('axios');
const router = express.Router();

// In-memory storage for price history
const priceHistory = {
  ms: [],
  '5m': [],
  '1h': [],
  '1d': [],
  '7d': [],
};

// Cache for the latest price
let cachedPrice = {
  price: 0,
  timestamp: Date.now(),
  validUntil: Date.now(),
};

// Helper function to calculate average
const calculateAverage = (data) => {
  const sum = data.reduce((acc, point) => acc + point.price, 0);
  return sum / data.length;
};

// Fetch current Solana price with retry logic
const fetchSolanaPrice = async (retryCount = 0) => {
  try {
    const response = await axios.get('https://api.coinbase.com/v2/prices/SOL-USD/spot', {
      timeout: 3000 // Set timeout to 2 seconds
    });
    const price = parseFloat(response.data.data.amount);
    
    // Update cache
    cachedPrice = {
      price,
      timestamp: Date.now(),
      validUntil: Date.now() + 1000 // Cache valid for 1 second
    };
    
    return price;
  } catch (error) {
    console.error('Error fetching Solana price:', error);
    
    // If we have a cached price and it's still valid, return it
    if (cachedPrice.validUntil > Date.now()) {
      return cachedPrice.price;
    }
    
    // Retry up to 3 times
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

  // Update ms history
  priceHistory.ms.push({ timestamp: now, price: newPrice });
  if (priceHistory.ms.length > 300) priceHistory.ms.shift();

  // Update 5m history (1 second interval)
  if (priceHistory['5m'].length === 0 || now - priceHistory['5m'][priceHistory['5m'].length - 1].timestamp >= 1000) {
    priceHistory['5m'].push({ timestamp: now, price: newPrice });
    if (priceHistory['5m'].length > 300) priceHistory['5m'].shift();
  }

  // Update 1h history (10 seconds interval)
  if (priceHistory['1h'].length === 0 || now - priceHistory['1h'][priceHistory['1h'].length - 1].timestamp >= 10000) {
    priceHistory['1h'].push({ timestamp: now, price: newPrice });
    if (priceHistory['1h'].length > 360) priceHistory['1h'].shift();
  }

  // Update 1d history (5 minutes interval)
  if (priceHistory['1d'].length === 0 || now - priceHistory['1d'][priceHistory['1d'].length - 1].timestamp >= 300000) {
    priceHistory['1d'].push({ timestamp: now, price: newPrice });
    if (priceHistory['1d'].length > 288) priceHistory['1d'].shift();
  }

  // Update 7d history (30 minutes interval)
  if (priceHistory['7d'].length === 0 || now - priceHistory['7d'][priceHistory['7d'].length - 1].timestamp >= 1800000) {
    priceHistory['7d'].push({ timestamp: now, price: newPrice });
    if (priceHistory['7d'].length > 336) priceHistory['7d'].shift();
  }

  // Calculate averages for all periods
  Object.keys(priceHistory).forEach(period => {
    const average = calculateAverage(priceHistory[period]);
    priceHistory[period] = priceHistory[period].map(point => ({
      ...point,
      average,
    }));
  });
};

// Start updating price history every 333ms (3 times per second)
setInterval(updatePriceHistory, 333);

// Endpoint to get price history
router.get('/history', (req, res) => {
  res.json(priceHistory);
});

module.exports = router;