const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireResident } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/users/residents
// @desc    Create a new resident (Admin only)
// @access  Private (Admin)
router.post('/residents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      username,
      password,
      fullName,
      email,
      phone,
      roomNumber,
      floor,
      emergencyContact,
      imageUrl,
      vehicleDetails
    } = req.body;

    // Validation for required fields
    if (!username || !password || !fullName || !email || !phone || !roomNumber || !floor || !emergencyContact) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: username, password, fullName, email, phone, roomNumber, floor, emergencyContact'
      });
    }
    
    // Validate vehicle details if vehicle is present
    if (vehicleDetails && vehicleDetails.hasVehicle) {
      if (!vehicleDetails.vehicleType || !vehicleDetails.vehicleNumber || !vehicleDetails.vehicleBrand || !vehicleDetails.vehicleColor) {
        return res.status(400).json({
          success: false,
          message: 'If vehicle is present, vehicle type, number, brand, and color are required'
        });
      }
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if room is already occupied
    const existingRoom = await User.findOne({ roomNumber, isActive: true });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room is already occupied'
      });
    }

    // Create new resident
    const newResident = new User({
      username,
      password,
      plainTextPassword: password, // Store plain text for admin reference
      role: 'resident',
      fullName,
      email,
      phone,
      imageUrl: imageUrl || null,
      roomNumber,
      floor,
      emergencyContact,
      vehicleDetails: vehicleDetails || { hasVehicle: false },
      createdBy: req.user._id
    });

    await newResident.save();

    // Remove password from response
    const residentResponse = newResident.toJSON();

    res.status(201).json({
      success: true,
      message: 'Resident created successfully',
      resident: residentResponse
    });

  } catch (error) {
    console.error('Create resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating resident'
    });
  }
});

// @route   GET /api/users/residents
// @desc    Get all residents (Admin only)
// @access  Private (Admin)
router.get('/residents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const residents = await User.find({ role: 'resident' })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    // Convert to admin format (includes plainTextPassword)
    const residentsWithPasswords = residents.map(resident => resident.toAdminJSON());

    res.json({
      success: true,
      count: residents.length,
      residents: residentsWithPasswords
    });

  } catch (error) {
    console.error('Get residents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching residents'
    });
  }
});

// @route   GET /api/users/residents/:id
// @desc    Get single resident by ID (Admin only)
// @access  Private (Admin)
router.get('/residents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resident = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'username');

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    if (resident.role !== 'resident') {
      return res.status(400).json({
        success: false,
        message: 'User is not a resident'
      });
    }

    res.json({
      success: true,
      resident
    });

  } catch (error) {
    console.error('Get resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resident'
    });
  }
});

// @route   PUT /api/users/residents/:id
// @desc    Update resident information (Admin only)
// @access  Private (Admin)
router.put('/residents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      imageUrl,
      roomNumber,
      floor,
      emergencyContact,
      vehicleDetails,
      isActive
    } = req.body;

    const resident = await User.findById(req.params.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    if (resident.role !== 'resident') {
      return res.status(400).json({
        success: false,
        message: 'User is not a resident'
      });
    }

    // Check if new email already exists (if email is being updated)
    if (email && email !== resident.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Check if new room is already occupied (if room is being updated)
    if (roomNumber && roomNumber !== resident.roomNumber) {
      const existingRoom = await User.findOne({ 
        roomNumber, 
        isActive: true, 
        _id: { $ne: req.params.id } 
      });
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Room is already occupied'
        });
      }
    }

    // Update fields
    if (fullName) resident.fullName = fullName;
    if (email) resident.email = email;
    if (phone) resident.phone = phone;
    if (imageUrl !== undefined) resident.imageUrl = imageUrl;
    if (roomNumber) resident.roomNumber = roomNumber;
    if (floor !== undefined) resident.floor = floor;
    if (emergencyContact) resident.emergencyContact = emergencyContact;
    if (vehicleDetails !== undefined) resident.vehicleDetails = vehicleDetails;
    if (isActive !== undefined) resident.isActive = isActive;

    await resident.save();

    const residentResponse = resident.toJSON();

    res.json({
      success: true,
      message: 'Resident updated successfully',
      resident: residentResponse
    });

  } catch (error) {
    console.error('Update resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating resident'
    });
  }
});

// @route   DELETE /api/users/residents/:id
// @desc    Delete resident (Admin only)
// @access  Private (Admin)
router.delete('/residents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resident = await User.findById(req.params.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    if (resident.role !== 'resident') {
      return res.status(400).json({
        success: false,
        message: 'User is not a resident'
      });
    }

    // Actually delete the resident from database
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Resident deleted successfully'
    });

  } catch (error) {
    console.error('Delete resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting resident'
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let user = req.user;

    // If resident, populate createdBy field
    if (user.role === 'resident') {
      user = await User.findById(user._id)
        .select('-password')
        .populate('createdBy', 'username');
    }

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   GET /api/users/dashboard-stats
// @desc    Get dashboard statistics (Admin only)
// @access  Private (Admin)
router.get('/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalResidents = await User.countDocuments({ role: 'resident' });
    const activeResidents = totalResidents; // All residents are active since we delete instead of deactivate

    // Get floor-wise count
    const floorStats = await User.aggregate([
      { $match: { role: 'resident' } },
      { $group: { _id: '$floor', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get recent residents (last 10)
    const recentResidents = await User.find({ role: 'resident' })
      .select('fullName roomNumber floor createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalResidents,
        activeResidents,
        floorStats,
        recentResidents
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats'
    });
  }
});

module.exports = router;
