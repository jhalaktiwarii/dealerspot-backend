const express = require('express');
const router = express.Router();
const { docClient } = require('../utils/awsConfig');
const { v4: uuidv4 } = require('uuid');

// POST new monthly expense
router.post('/', async (req, res) => {
  const { companyName, totalCars, rentLegalExpense, lightBill, employeeCost, others, monthlyExpense, dailyExpense, perCarExpense } = req.body;
  const params = {
    TableName: 'MonthlyExpenses',
    Item: {
      id: uuidv4(),
      companyName,
      createdAt: new Date().toISOString(),
      totalCars,
      rentLegalExpense,
      lightBill,
      employeeCost,
      others,
      monthlyExpense,
      dailyExpense,
      perCarExpense
    }
  };

  try {
    await docClient.put(params).promise();
    res.status(201).json({ message: 'Monthly expense saved successfully', expense: params.Item });
  } catch (error) {
    console.error('Error saving monthly expense:', error);
    res.status(500).json({ message: 'Error saving monthly expense' });
  }
});

router.get('/', async (req, res) => {
  const { companyName } = req.query;
  const params = {
    TableName: 'MonthlyExpenses',
    FilterExpression: 'companyName = :companyName',
    ExpressionAttributeValues: {
      ':companyName': companyName
    }
  };

  try {
    const data = await docClient.scan(params).promise();
    res.status(200).json(data.Items);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ message: 'Error fetching monthly expenses' });
  }
});

module.exports = router;
