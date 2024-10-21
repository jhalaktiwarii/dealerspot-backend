const { docClient } = require('../utils/awsConfig');

exports.addFriend = async (req, res) => {
  const { friendName, friendCompany } = req.body;

  try {
    // Check if the friend already exists
    const checkFriendParams = {
      TableName: 'Friends',
      KeyConditionExpression: '#owner = :ownerValue',
      FilterExpression: 'company = :companyValue',
      ExpressionAttributeNames: {
        '#owner': 'owner'
      },
      ExpressionAttributeValues: {
        ':ownerValue': req.companyName,
        ':companyValue': friendCompany
      }
    };

    const existingFriend = await docClient.query(checkFriendParams).promise();

    if (existingFriend.Items && existingFriend.Items.length > 0) {
      return res.status(400).json({ error: 'This friend is already in your list' });
    }

    const checkUserParams = {
      TableName: 'Users',
      Key: {
        CompanyName: friendCompany
      }
    };

     let userData = await docClient.get(checkUserParams).promise();
     
    // If not found, try case-insensitive search
    if (!userData.Item) {
       const scanParams = {
        TableName: 'Users',
        FilterExpression: 'contains(#companyName, :friendCompany)',
        ExpressionAttributeNames: {
          '#companyName': 'CompanyName'
        },
        ExpressionAttributeValues: {
          ':friendCompany': friendCompany.toLowerCase()
        }
      };

       const scanResult = await docClient.scan(scanParams).promise();
       if (scanResult.Items && scanResult.Items.length > 0) {
        userData = { Item: scanResult.Items[0] };
      }
    }

    if (!userData.Item) {
      console.log('User not found in the database');
      return res.status(404).json({ error: 'User not found in the database' });
    }

    console.log('User found:', JSON.stringify(userData.Item));

    // If user exists, proceed with adding the friend
    const params = {
      TableName: 'Friends',
      Item: {
        owner: req.companyName,
        friendId: Date.now().toString(),
        name: friendName,
        company: userData.Item.CompanyName,
        createdAt: new Date().toISOString()
      }
    };

     await docClient.put(params).promise();
     res.status(200).json({ message: 'Friend added successfully', friend: params.Item });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ error: 'Error adding friend: ' + error.message });
  }
};

// Get all friends
exports.getAllFriends = async (req, res) => {
  const params = {
    TableName: 'Friends',
    KeyConditionExpression: '#owner = :ownerValue',
    ExpressionAttributeNames: {
      '#owner': 'owner'
    },
    ExpressionAttributeValues: {
      ':ownerValue': req.companyName
    }
  };

  try {
    const data = await docClient.query(params).promise();
    res.status(200).json(data.Items);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Error fetching friends' });
  }
};

// Delete a friend
exports.deleteFriend = async (req, res) => {
  const { friendId } = req.params;

  const params = {
    TableName: 'Friends',
    Key: {
      owner: req.companyName,
      friendId: friendId
    }
  };

  try {
    await docClient.delete(params).promise();
    res.status(200).json({ message: 'Friend deleted successfully' });
  } catch (error) {
    console.error('Error deleting friend:', error);
    res.status(500).json({ error: 'Error deleting friend' });
  }
};

// Get friends' cars
exports.getFriendsCars = async (req, res) => {
  try {
     const friendsParams = {
      TableName: 'Friends',
      KeyConditionExpression: '#owner = :ownerValue',
      ExpressionAttributeNames: {
        '#owner': 'owner'
      },
      ExpressionAttributeValues: {
        ':ownerValue': req.companyName
      }
    };

    const friendsData = await docClient.query(friendsParams).promise();
     const friends = friendsData.Items;

    // Get all cars
    const allCarsParams = {
      TableName: 'Cars',
      FilterExpression: '#status = :statusValue',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':statusValue': 'available'
      }
    };

    const allCarsData = await docClient.scan(allCarsParams).promise();
    const allCars = allCarsData.Items;

    // Filter cars based on friends' companies
    const friendsCars = allCars.filter(car => 
      friends.some(friend => friend.company === car.companyName || friend.name === car.companyName)
    );

 
    res.status(200).json(friendsCars);
  } catch (error) {
    console.error('Error fetching friends\' cars:', error);
    res.status(500).json({ error: 'Error fetching friends\' cars' });
  }
};



exports.searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    // First, get the list of existing friends
    const friendsParams = {
      TableName: 'Friends',
      KeyConditionExpression: '#owner = :ownerValue',
      ExpressionAttributeNames: {
        '#owner': 'owner'
      },
      ExpressionAttributeValues: {
        ':ownerValue': req.companyName
      }
    };

    const friendsData = await docClient.query(friendsParams).promise();
    const existingFriends = friendsData.Items.map(friend => friend.company);

    // Now search for users
    const scanParams = {
      TableName: 'Users',
      FilterExpression: '(contains(#companyName, :query) OR contains(#name, :query)) AND #companyName <> :ownerCompany',
      ExpressionAttributeNames: {
        '#companyName': 'CompanyName',
        '#name': 'Name'
      },
      ExpressionAttributeValues: {
        ':query': query.toLowerCase(),
        ':ownerCompany': req.companyName
      }
    };

    const scanResult = await docClient.scan(scanParams).promise();
    
    const users = scanResult.Items
      .filter(user => !existingFriends.includes(user.CompanyName))
      .map(user => ({
        companyName: user.CompanyName,
        name: user.Name
      }));

    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Error searching users' });
  }
};
