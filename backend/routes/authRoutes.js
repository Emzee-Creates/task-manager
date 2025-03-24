const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const router = express.Router();

// ✅ Register Route (Now hashes passwords before saving)
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    // ❌ REMOVE THIS LINE ❌
    // const hashedPassword = await bcrypt.hash(password, 10);
  
    // ✅ Save password directly (It will be hashed in userModel.js)
    const user = new User({ username, email, password });
  
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  });
  
  

// ✅ Login Route (Now returns token + user data)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    console.log("🔍 Checking login for:", email);
  
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    console.log("✅ User found:", user);
  
    const match = await bcrypt.compare(password, user.password);
    console.log("🔍 Password match result:", match);
  
    if (!match) {
      console.log("❌ Incorrect password for:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
    res.json({ 
      token, 
      user: { _id: user._id, username: user.username, email: user.email } 
    });
  });
  
module.exports = router;
