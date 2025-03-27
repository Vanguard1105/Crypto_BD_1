const authRoutes = require('./routes/auth');
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./lib/mongodb');
const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = process.env.AllowedOrigins;
// Strict CORS configuration
// const corsOptions = {
//   origin: (origin, callback) => {
//     // Allow requests only from the specified frontend URL
    
    
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
//   methods: 'GET,POST,PUT,DELETE', // Allowed HTTP methods
//   allowedHeaders: 'Content-Type,Authorization', // Allowed headers
//   credentials: true // Allow cookies and credentials
// };

// // Apply CORS middleware
// app.use(cors(corsOptions));

// // Middleware to explicitly check Origin header for all requests
// app.use((req, res, next) => {
//   const allowedOrigins = ['https://crypto-bet-frontend.vercel.app'];
//   const origin = req.headers.origin;

//   // Block requests from disallowed origins or requests without an origin
//   if (!origin || !allowedOrigins.includes(origin)) {
//     return res.status(403).json({ error: 'Access denied: Origin not allowed' });
//   }

//   next();
// });

// // Handle CORS errors
// app.use((err, req, res, next) => {
//   if (err.message === 'Not allowed by CORS') {
//     res.status(403).json({ error: 'Access denied: Origin not allowed' });
//   } else {
//     next(err);
//   }
// });

// Update CORS options to allow all origins  
const corsOptions = {  
  origin: '*', // Allow requests from any origin  
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204  
  methods: 'GET,POST,PUT,DELETE', // Allowed HTTP methods  
  allowedHeaders: 'Content-Type,Authorization', // Allowed headers  
  credentials: true // Allow cookies and credentials  
};  

// Apply CORS middleware  
app.use(cors(corsOptions));  

app.use(express.json());

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);

startServer();