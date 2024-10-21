const AWS = require('aws-sdk');
const argon2 = require('argon2');
const dynamoDB = require('../models/dynamoDB');

// Register a new user
const registerUser = async (req, res) => {
    const { companyName, contactNumber, ownerName, location, gstin, password } = req.body;

    try {
        // Hash the password
        const passwordHash = await argon2.hash(password);

        const params = {
            TableName: 'Users',
            Item: {
                CompanyName: companyName,        
                ContactNumber: contactNumber,    
                OwnerName: ownerName,            
                Location: location,              
                GSTIN: gstin,                    
                PasswordHash: passwordHash,      
                CreatedAt: new Date().toISOString()  
            }
        };

        await dynamoDB.put(params).promise();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
};

// Login user
const loginUser = async (req, res) => {
    const { companyName, password } = req.body;

    const params = {
        TableName: 'Users',
        Key: { CompanyName: companyName }
    };

    try {
        const data = await dynamoDB.get(params).promise();
        if (!data.Item) return res.status(404).json({ error: 'User not found' });

        const user = data.Item;
        const match = await argon2.verify(user.PasswordHash, password);
        if (match) {
            res.status(200).json({ message: 'Login successful', user });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

module.exports = { registerUser, loginUser };
