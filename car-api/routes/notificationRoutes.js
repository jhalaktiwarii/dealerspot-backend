const express = require('express');
const { 
  getAllNotifications, 
  markNotificationAsRead, 
  markNotificationAsSeen,
  getNotificationSettings,
  setNotificationSettings
} = require('../services/notificationService');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { companyName } = req.query;
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const notifications = await getAllNotifications(companyName);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const { companyName } = req.query;
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    await markNotificationAsRead(req.params.id, companyName);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error marking notification as read' });
  }
});

router.put('/:id/seen', async (req, res) => {
  try {
    const { companyName } = req.query;
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    await markNotificationAsSeen(req.params.id, companyName);
    res.json({ message: 'Notification marked as seen' });
  } catch (error) {
    console.error('Error marking notification as seen:', error);
    res.status(500).json({ error: 'Error marking notification as seen' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const { companyName } = req.query;
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const enabled = await getNotificationSettings(companyName);
    res.json({ notificationsEnabled: enabled });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Error fetching notification settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { companyName } = req.query;
    const { enabled } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    await setNotificationSettings(companyName, enabled);
    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Error updating notification settings' });
  }
});

module.exports = router;
