const AWS = require('aws-sdk');

// DynamoDB configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION.trim()
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports = dynamoDB;
