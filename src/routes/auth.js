const express = require('express');
const { getDb } = require('../lib/mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vanguard1105';

// Login endpoint
router.post('/login', async (req, res) => {
  const { user_id, password } = req.body;
  
  try {
    const db = await getDb();
    const user = await db.collection('betting').findOne({ user_id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' + user_id });
    }

    if (!user.password) {
      return res.status(200).json({ needsPassword: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      message: 'Login successful',
      token 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add token verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
    
    // Add user info to request
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  });
};

// Example protected route
router.get('/protected', verifyToken, (req, res) => {
  res.json({ 
    message: 'This is a protected route',
    user: req.username 
  });
});

// Signup/Set password endpoint
router.post('/set-password', async (req, res) => {
  const { user_id, email, password } = req.body;

  try {
    const db = await getDb(); // Ensure we await the database connection
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.collection('betting').updateOne(
      { "user_id": user_id },
      { $set: { password: hashedPassword , email: email} }
    );

    res.status(200).json({ message: 'Password set successfully' });
  } catch (err) {
    console.error('Set password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getData/:user_id', async (req, res) => {
  const { user_id } = req.params;
  
  try {
    const db = await getDb(); // Ensure we await the database connection
    const user = await db.collection('betting').findOne({ user_id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' + user_id });
    }

    const userData = {
      username: user.username,
      publicKey: user.public_key,
      hasPassword: !!user.password,
      email: user.email
    };

    res.status(200).json(userData);
  } catch (err) {
    console.error('Get data error:', err);
    res.status(500).json({ message: err });
  }
});

module.exports = router;