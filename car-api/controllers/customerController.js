const { docClient } = require('../utils/awsConfig');
const customerSchema = require('../models/customerModal');
const { v4: uuidv4 } = require('uuid');

exports.submitCustomerFeedback = async (req, res) => {
  try {
    const validatedData = customerSchema.parse(req.body);
 
    const params = {
      TableName: 'CustomerFeedback',
      Item: {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        owner: req.companyName,
        ...validatedData
      }
    };

    await docClient.put(params).promise();

    res.status(200).json({ message: 'Customer feedback submitted successfully' });
  } catch (error) {
    console.error('Error in submitCustomerFeedback:', error);
    if (error.errors) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Error submitting customer feedback' });
    }
  }
};

exports.getCustomerFeedback = async (req, res) => {
  try {
    const { isWalkIn } = req.query;
    const params = {
      TableName: 'CustomerFeedback',
      FilterExpression: '#ownerAttr = :ownerValue AND isWalkIn = :isWalkInValue',
      ExpressionAttributeNames: {
        '#ownerAttr': 'owner'
      },
      ExpressionAttributeValues: {
        ':ownerValue': req.companyName,
        ':isWalkInValue': isWalkIn === 'true'
      }
    };

    const result = await docClient.scan(params).promise();

    res.status(200).json(result.Items);
  } catch (error) {
    console.error('Error in getCustomerFeedback:', error);
    res.status(500).json({ error: 'Error fetching customer feedback' });
  }
};
