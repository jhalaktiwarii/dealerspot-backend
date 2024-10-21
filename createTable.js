const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',  // Ensure region is set to 'ap-south-1'
});

const dynamodb = new AWS.DynamoDB();

// Define table parameters
const params = {
  TableName: 'Users',
  KeySchema: [
    { AttributeName: 'CompanyName', KeyType: 'HASH' },  // Primary key
  ],
  AttributeDefinitions: [
    { AttributeName: 'CompanyName', AttributeType: 'S' }, // String
    { AttributeName: 'Email', AttributeType: 'S' }, // String for optional GSI
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'Email-index',
      KeySchema: [{ AttributeName: 'Email', KeyType: 'HASH' }],  // GSI based on Email
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

// Create the table
dynamodb.createTable(params, (err, data) => {
  if (err) {
    console.error('Unable to create table. Error:', JSON.stringify(err, null, 2));
  } else {
    console.log('Table created successfully:', JSON.stringify(data, null, 2));
  }
});
