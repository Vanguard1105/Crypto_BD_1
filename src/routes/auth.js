const express = require('express');
const { getDb } = require('../lib/mongodb');
const bcrypt = require('bcrypt');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password)
  const db = getDb();
  
  try {
    const user = await db.collection('betting').findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(200).json({ needsPassword: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Signup/Set password endpoint
router.post('/set-password', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password)

  const db = getDb();
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.collection('betting').updateOne(
      { username },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: 'Password set successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getData/:username', async (req, res) => {
  const { username } = req.params;
  const db = getDb();

  try {
    const user = await db.collection('betting').findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = {
      username: user.username,
      publicKey: user.public_key,
      hasPassword: !!user.password  // Returns true if password exists, false otherwise
    };

    res.status(200).json(userData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;