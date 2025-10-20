const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/notifications/send
// @desc    Send notification to a resident (Admin only)
// @access  Private (Admin)
router.post('/send', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { recipientId, type, title, message, isUrgent } = req.body;

    // Validation
    if (!recipientId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, title, and message are required'
      });
    }

    // Check if recipient exists and is a resident
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    if (recipient.role !== 'resident') {
      return res.status(400).json({
        success: false,
        message: 'Can only send notifications to residents'
      });
    }

    // Create notification
    const notification = new Notification({
      recipient: recipientId,
      sender: req.user._id,
      type: type || 'general',
      title,
      message,
      isUrgent: isUrgent || false
    });

    await notification.save();

    // Populate sender info for response
    await notification.populate('sender', 'username');
    await notification.populate('recipient', 'fullName username');

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending notification'
    });
  }
});

// @route   GET /api/notifications/my-notifications
// @desc    Get notifications for current user (Resident)
// @access  Private (Resident)
router.get('/my-notifications', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalNotifications = await Notification.countDocuments({ recipient: req.user._id });
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
});

// @route   PUT /api/notifications/:id/respond
// @desc    Respond to notification (coming/not_coming)
// @access  Private (Resident)
router.put('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { response, responseMessage } = req.body;
    
    // Validation
    if (!response || !['coming', 'not_coming'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Valid response is required: coming or not_coming'
      });
    }

    const notification = await Notification.findById(req.params.id)
      .populate('recipient', 'fullName username')
      .populate('sender', 'username');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update notification with response
    notification.hasResponse = true;
    notification.response = response;
    notification.responseAt = new Date();
    notification.responseMessage = responseMessage || null;
    notification.isRead = true; // Mark as read when responding
    notification.readAt = notification.readAt || new Date();
    
    await notification.save();

    res.json({
      success: true,
      message: `Response "${response === 'coming' ? 'Coming' : 'Not Coming'}" recorded successfully`,
      notification
    });

  } catch (error) {
    console.error('Respond to notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while responding to notification'
    });
  }
});

// @route   GET /api/notifications/sent
// @desc    Get notifications sent by admin
// @access  Private (Admin)
router.get('/sent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ sender: req.user._id })
      .populate('recipient', 'fullName username roomNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalNotifications = await Notification.countDocuments({ sender: req.user._id });

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications
      }
    });

  } catch (error) {
    console.error('Get sent notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sent notifications'
    });
  }
});

module.exports = router;
