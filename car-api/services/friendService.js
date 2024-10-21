const { docClient } = require('../utils/awsConfig');

exports.getFriends = async (companyName) => {
  const params = {
    TableName: 'Friends',
    KeyConditionExpression: '#owner = :ownerValue',
    ExpressionAttributeNames: {
      '#owner': 'owner'
    },
    ExpressionAttributeValues: {
      ':ownerValue': companyName
    }
  };

  try {
    const result = await docClient.query(params).promise();
    return result.Items;
  } catch (error) {
    console.error('Error fetching friends:', error);
    throw error;
  }
};

exports.addFriend = async (companyName, friendId) => {
  const params = {
    TableName: 'Friends',
    Item: {
      owner: companyName,
      friendId: friendId,
      // ... other attributes ...
    }
  };

  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.error('Error adding friend:', error);
    throw error;
  }
};


