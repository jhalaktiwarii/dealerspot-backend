const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dynamoDB = require('./awsConfig'); // Import the DynamoDB instance
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const helmet = require('helmet'); // Added for security
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://www.dealerspot.in',
    'https://master.d2h9m8dpuy41tz.amplifyapp.com',
  ],
  methods: ['GET', 'POST', 'DELETE'],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(helmet());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || '314046ce3e3a0776d03bf85a71f5b446ca75172afaa4a5a9022412995167332060cef778bab4276cde7f3d0c8498aa8d9e03c02ccfb92c59e12bac1aade66e25';

// User registration endpoint
app.post('/api/register', async (req, res) => {
  const { companyName, contactNumber, ownerName, location, gstin, email, password } = req.body;

  // Validate input
  if (!companyName || !contactNumber || !ownerName || !location || !gstin || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const passwordHash = await argon2.hash(password);

    const params = {
      TableName: 'Users',
      Item: {
        CompanyName: companyName,
        ContactNumber: contactNumber,
        OwnerName: ownerName,
        Location: location,
        GSTIN: gstin,
        Email: email,  
        PasswordHash: passwordHash,
        CreatedAt: new Date().toISOString(),
        Friends: [],
      },
    };

    await dynamoDB.put(params).promise();
    const token = jwt.sign({ companyName }, JWT_SECRET);

    res.header('Authorization', `Bearer ${token}`);
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error('AWS DynamoDB Error:', error);
    res.status(500).json({ error: 'An error occurred while registering the user', details: error.message });
  }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;

  // Validate input
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Both identifier (company name or email) and password are required' });
  }

  try {
    const params = {
      TableName: 'Users',
      FilterExpression: 'CompanyName = :identifier OR Email = :identifier',
      ExpressionAttributeValues: {
        ':identifier': identifier
      }
    };

    const scanResult = await dynamoDB.scan(params).promise();

    if (scanResult.Items.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = scanResult.Items[0];
    const match = await argon2.verify(user.PasswordHash, password);

    if (match) {
      const token = jwt.sign({ companyName: user.CompanyName }, JWT_SECRET);
      res.header('Authorization', `Bearer ${token}`);
      res.status(200).json({ message: 'Login successful', token });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: `Login failed: ${error.message}`, stack: error.stack });
  }
});

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get the token from Bearer scheme

  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
    req.user = decoded;
    next();
  });
};

// Add friends endpoint
app.post('/api/friends', verifyToken, async (req, res) => {
  const { friendCompanyName } = req.body;
  const { companyName } = req.user;

  if (!friendCompanyName) {
    return res.status(400).json({ error: 'Friend company name is required' });
  }

  const params = {
    TableName: 'Users',
    Key: { CompanyName: companyName },
    UpdateExpression: 'ADD Friends :friendCompanyName',
    ExpressionAttributeValues: {
      ':friendCompanyName': dynamoDB.createSet([friendCompanyName]),
    },
  };

  try {
    await dynamoDB.update(params).promise();
    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ error: 'Error adding friend' });
  }
});

// Delete friends endpoint
app.delete('/api/friends/:friendCompanyName', verifyToken, async (req, res) => {
  const { friendCompanyName } = req.params;
  const { companyName } = req.user;

  const params = {
    TableName: 'Users',
    Key: { CompanyName: companyName },
    UpdateExpression: 'DELETE Friends :friendCompanyName',
    ExpressionAttributeValues: {
      ':friendCompanyName': dynamoDB.createSet([friendCompanyName]),
    },
  };

  try {
    await dynamoDB.update(params).promise();
    res.status(200).json({ message: 'Friend deleted successfully' });
  } catch (error) {
    console.error('Error deleting friend:', error);
    res.status(500).json({ error: 'Error deleting friend' });
  }
});

// Test scan endpoint
app.get('/api/test-scan', async (req, res) => {
  try {
    const params = {
      TableName: 'Users',
      Limit: 1 // Just to get one item
    };
    const result = await dynamoDB.scan(params).promise();
    res.json({ success: true, item: result.Items[0] });
  } catch (error) {
    console.error('Test scan error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`Backend listening on HTTP port ${PORT}`);
});
