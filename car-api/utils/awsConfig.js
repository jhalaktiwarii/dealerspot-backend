const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure AWS DynamoDB
const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

// Function to create DynamoDB table if it doesn't exist
const createTableIfNotExists = async () => {
  const params = {
    TableName: 'Cars',
    KeySchema: [
      { AttributeName: 'owner', KeyType: 'HASH' },
      { AttributeName: 'createdAt', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'owner', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await dynamodb.createTable(params).promise();
   } catch (error) {
    if (error.code === 'ResourceInUseException') {
     } else {
      console.error('Error creating Cars table:', error);
      throw error;
    }
  }
};

// Create Friends table if it doesn't exist
const createFriendsTableIfNotExists = async () => {
  const params = {
    TableName: 'Friends',
    KeySchema: [
      { AttributeName: 'owner', KeyType: 'HASH' },
      { AttributeName: 'friendId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'owner', AttributeType: 'S' },
      { AttributeName: 'friendId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await dynamodb.createTable(params).promise();
    console.log('Friends table created successfully');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Friends table already exists');
    } else {
      console.error('Error creating Friends table:', error);
      throw error;
    }
  }
};

// Initialize tables
const initializeTables = async () => {
  const tables = [
    {
      TableName: 'Cars',
      KeySchema: [
        { AttributeName: 'owner', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'owner', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      TableName: 'Friends',
      KeySchema: [
        { AttributeName: 'owner', KeyType: 'HASH' },
        { AttributeName: 'friendId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'owner', AttributeType: 'S' },
        { AttributeName: 'friendId', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      TableName: 'CustomerFeedback',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      TableName: 'MonthlyExpenses',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      TableName: 'Notifications',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'companyName', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'companyName', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      TableName: 'UserSettings',
      KeySchema: [
        { AttributeName: 'companyName', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'companyName', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ];

  for (const tableParams of tables) {
    try {
      await dynamodb.createTable(tableParams).promise();
      console.log(`Created table: ${tableParams.TableName}`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`Table already exists: ${tableParams.TableName}`);
      } else {
        console.error(`Error creating table ${tableParams.TableName}:`, error);
      }
    }
  }
};

// Function to upload file to S3
const uploadToS3 = async (file, type) => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }

  const fileName = `${Date.now()}_${file.originalname}`;
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${type}/${fileName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${type}/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

const createNotificationsTableIfNotExists = async () => {
  const params = {
    TableName: "Notifications",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" },
      { AttributeName: "companyName", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "companyName", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await dynamodb.createTable(params).promise();
    console.log("Notifications table created successfully");
  } catch (error) {
    if (error.code !== 'ResourceInUseException') {
      console.error("Error creating Notifications table:", error);
    }
  }
};

module.exports = {
  dynamodb,
  docClient,
  s3,
  uploadToS3,
  initializeTables,
  createTableIfNotExists,
  createFriendsTableIfNotExists,
  createNotificationsTableIfNotExists
};
