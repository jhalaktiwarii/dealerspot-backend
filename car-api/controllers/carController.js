const { docClient } = require('../utils/awsConfig');
const { z } = require('zod');
const { uploadToS3 } = require('../utils/s3Utils'); // Assume we've moved S3 operations to a separate file
const { createNotification } = require('../services/notificationService');
const { getFriends } = require('../services/friendService');

const carSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  transmission: z.enum(['manual', 'auto']),
  color: z.string().min(1, "Color is required"),
  insurance: z.string().min(1, "Insurance details are required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  originalPrice: z.number().positive(),
  refurb: z.string().min(1, "Refurb details are required"),
  interestRate: z.number().min(0).max(100),
  fuel: z.enum(['petrol', 'diesel', 'cng', 'ev']),
  negotiationBuffer: z.number(),
  profitMargin: z.number(),
  currentPrice: z.number(),
  suggestedPrice: z.number(),
  description: z.string().min(1, "Description is required"),
  kmsDriven: z.number().int().positive()
});

exports.submitCarData = async (req, res) => {
  try {
    const validatedData = carSchema.parse({
      ...req.body,
      year: parseInt(req.body.year),
      originalPrice: parseFloat(req.body.originalPrice),
      interestRate: parseFloat(req.body.interestRate),
      negotiationBuffer: parseFloat(req.body.negotiationBuffer),
      profitMargin: parseFloat(req.body.profitMargin),
      currentPrice: parseFloat(req.body.currentPrice),
      suggestedPrice: parseFloat(req.body.suggestedPrice),
      kmsDriven: parseInt(req.body.kmsDriven)
    });

    const files = req.files;

    // Start file uploads and friend fetching concurrently
    const [photoUrls, videoUrl, friends] = await Promise.all([
      Promise.all((files.photos || []).slice(0, 5).map(photo => uploadToS3(photo, 'cars/photos'))),
      files.video && files.video[0] ? uploadToS3(files.video[0], 'cars/videos') : null,
      getFriends(req.companyName)
    ]);

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video file is required but was not provided or failed to upload' });
    }

    const carData = {
      ...validatedData,
      owner: req.companyName,
      companyName: req.companyName,
      createdAt: new Date().toISOString(),
      photoUrls,
      videoUrl,
      status: 'available'
    };

    // Save car data to DynamoDB
    await docClient.put({
      TableName: 'Cars',
      Item: carData
    }).promise();

    // Send response immediately
    res.status(201).json({ message: 'Car data submitted successfully', car: carData });

    // Create notifications asynchronously
    friends.forEach(friend => 
      createNotification(friend.company, `${req.companyName} added a ${carData.model} ${carData.year} for ₹${carData.originalPrice}`, 'friend_added_car')
        .catch(error => console.error('Error creating notification:', error))
    );

  } catch (error) {
    console.error('Error in submitCarData:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Error uploading files or saving data.', error: error.message });
    }
  }
};

exports.getAllCars = async (req, res) => {
 
  const params = {
    TableName: 'Cars',
    FilterExpression: '#ownerAttr = :ownerValue',
    ExpressionAttributeNames: {
      '#ownerAttr': 'owner'
    },
    ExpressionAttributeValues: {
      ':ownerValue': req.companyName
    }
  };

  try {
    const data = await docClient.scan(params).promise();
     res.status(200).json(data.Items);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Error fetching cars' });
  }
};

exports.updateCarStatus = async (req, res) => {
  const { model } = req.params;
  const { status, createdAt } = req.body;

  if (status !== 'available' && status !== 'sold') {
    return res.status(400).json({ error: 'Invalid status. Must be "available" or "sold".' });
  }

  const params = {
    TableName: 'Cars',
    Key: {
      owner: req.companyName,
      createdAt: createdAt
    },
    UpdateExpression: 'SET #statusAttr = :statusValue',
    ExpressionAttributeNames: {
      '#statusAttr': 'status'
    },
    ExpressionAttributeValues: {
      ':statusValue': status
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const result = await docClient.update(params).promise();
    res.status(200).json(result.Attributes);
  } catch (error) {
    console.error('Error updating car status:', error);
    res.status(500).json({ error: 'Error updating car status' });
  }
};

exports.getAllCarsWithPagination = async (req, res) => {
  const { lastEvaluatedKey, limit = 10 } = req.query;
  
  const params = {
    TableName: 'Cars',
    Limit: parseInt(limit),
    ExclusiveStartKey: lastEvaluatedKey ? JSON.parse(lastEvaluatedKey) : undefined
  };

  try {
    const data = await docClient.scan(params).promise();
     res.status(200).json({
      items: data.Items,
      lastEvaluatedKey: data.LastEvaluatedKey ? JSON.stringify(data.LastEvaluatedKey) : null
    });
  } catch (error) {
    console.error('Error fetching all cars:', error);
    res.status(500).json({ error: 'Error fetching all cars' });
  }
};
