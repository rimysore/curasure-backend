const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../users.json');

// Function to read users from file
const readUsersFromFile = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

// Function to write users to file
const writeUsersToFile = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
};

// Register Route
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  // Read existing users
  let users = readUsersFromFile();

  // Check if user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store user
  const newUser = { email, password: hashedPassword, role };
  users.push(newUser);
  writeUsersToFile(users);

  res.status(201).json({ message: 'User registered successfully' });
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate data
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Read users from file
  let users = readUsersFromFile();
  
  // Check if user exists
  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Create a JWT token
  const token = jwt.sign({ email: user.email, role: user.role }, 'mysecret', {
    expiresIn: '1h',
  });

  res.json({ message: 'Login successful', token });
});

module.exports = router;
