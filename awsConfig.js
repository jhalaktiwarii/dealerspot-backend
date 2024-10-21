const AWS = require('aws-sdk');

require('dotenv').config();
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

// Check for required environment variables
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
  throw new Error('AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION must be defined in environment variables');
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID.trim(),
  secretAccessKey: AWS_SECRET_ACCESS_KEY.trim(),
  region: AWS_REGION.trim(),
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports = dynamoDB;
