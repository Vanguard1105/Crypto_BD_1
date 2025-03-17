const express = require('express');
const cors = require('cors');  // Add this line
const { connectToDatabase } = require('./lib/mongodb');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());  // Add this line to enable CORS for all routes
app.use(express.json());

// Connect to MongoDB
connectToDatabase();

// Routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});