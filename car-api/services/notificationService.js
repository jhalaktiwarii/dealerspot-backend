const { docClient } = require('../utils/awsConfig');
const { v4: uuidv4 } = require('uuid');
let io;

const setIo = (socketIo) => {
  io = socketIo;
};

const createNotification = async (companyName, message, type) => {
  const notificationsEnabled = await getNotificationSettings(companyName);
  
  const params = {
    TableName: "Notifications",
    Item: {
      id: uuidv4(),
      companyName,
      message,
      type,
      isRead: false,
      isSeen: !notificationsEnabled,
      createdAt: new Date().toISOString()
    }
  };

  try {
    await docClient.put(params).promise();
    if (notificationsEnabled && io) {
      console.log(`Emitting new notification for company ${companyName}:`, params.Item);
      io.to(companyName).emit('new_notification', params.Item);
    }
    return params.Item;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

const getUnreadNotifications = async (companyName) => {
  const params = {
    TableName: "Notifications",
    FilterExpression: "companyName = :companyName and isRead = :isRead",
    ExpressionAttributeValues: {
      ":companyName": companyName,
      ":isRead": false
    }
  };

  try {
    const result = await docClient.scan(params).promise();
    return result.Items;
  } catch (error) {
    console.error("Error getting unread notifications:", error);
    throw error;
  }
};

const getUnseenNotifications = async (companyName) => {
  const params = {
    TableName: "Notifications",
    FilterExpression: "companyName = :companyName and isSeen = :isSeen",
    ExpressionAttributeValues: {
      ":companyName": companyName,
      ":isSeen": false
    }
  };

  try {
    const result = await docClient.scan(params).promise();
    return result.Items;
  } catch (error) {
    console.error("Error getting unseen notifications:", error);
    throw error;
  }
};

const markNotificationAsRead = async (id, companyName) => {
  const params = {
    TableName: "Notifications",
    Key: { 
      id: id,
      companyName: companyName
    },
    UpdateExpression: "set isRead = :isRead",
    ExpressionAttributeValues: {
      ":isRead": true
    }
  };

  try {
    await docClient.update(params).promise();
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

const markNotificationAsSeen = async (id, companyName) => {
  const params = {
    TableName: "Notifications",
    Key: { id, companyName },
    UpdateExpression: "set isSeen = :isSeen",
    ExpressionAttributeValues: {
      ":isSeen": true
    }
  };

  try {
    await docClient.update(params).promise();
  } catch (error) {
    console.error("Error marking notification as seen:", error);
    throw error;
  }
};

const getAllNotifications = async (companyName) => {
  const params = {
    TableName: 'Notifications',
    FilterExpression: 'companyName = :companyName',
    ExpressionAttributeValues: {
      ':companyName': companyName
    }
  };

  try {
    const result = await docClient.scan(params).promise();
    return result.Items;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

const getNotificationSettings = async (companyName) => {
  console.log('Getting notification settings for company:', companyName);
  const params = {
    TableName: "UserSettings",
    Key: { companyName }
  };


  try {
    const result = await docClient.get(params).promise();
    return result.Item ? result.Item.notificationsEnabled : true; // Default to true if not set
  } catch (error) {
    console.error("Error getting notification settings:", error);
    throw error;
  }
};

const setNotificationSettings = async (companyName, enabled) => {
  const params = {
    TableName: "UserSettings",
    Item: {
      companyName,
      notificationsEnabled: enabled
    }
  };

  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.error("Error setting notification settings:", error);
    throw error;
  }
};

module.exports = {
  setIo,
  createNotification,
  getUnreadNotifications,
  getUnseenNotifications,
  markNotificationAsRead,
  markNotificationAsSeen,
  getAllNotifications,
  getNotificationSettings,
  setNotificationSettings
};
