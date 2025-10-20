const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Plain text password for admin reference (educational/demo purposes)
  plainTextPassword: {
    type: String,
    required: function() {
      return this.role === 'resident';
    }
  },
  role: {
    type: String,
    enum: ['admin', 'resident'],
    default: 'resident'
  },
  
  // Personal Information (for residents)
  fullName: {
    type: String,
    required: function() {
      return this.role === 'resident';
    },
    trim: true
  },
  email: {
    type: String,
    required: function() {
      return this.role === 'resident';
    },
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: function() {
      return this.role === 'resident';
    },
    trim: true
  },
  
  // Profile Image (for residents)
  imageUrl: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  
  // Hostel Information (for residents)
  roomNumber: {
    type: String,
    required: function() {
      return this.role === 'resident';
    },
    trim: true
  },
  floor: {
    type: Number,
    required: function() {
      return this.role === 'resident';
    }
  },
  dateOfJoining: {
    type: Date,
    default: Date.now
  },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: function() {
        return this.role === 'resident';
      }
    },
    phone: {
      type: String,
      required: function() {
        return this.role === 'resident';
      }
    },
    relationship: {
      type: String,
      required: function() {
        return this.role === 'resident';
      }
    }
  },
  
  // Vehicle Information (for residents - optional)
  vehicleDetails: {
    hasVehicle: {
      type: Boolean,
      default: false
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'bicycle', 'other'],
      required: function() {
        return this.vehicleDetails?.hasVehicle;
      }
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      required: function() {
        return this.vehicleDetails?.hasVehicle;
      }
    },
    vehicleBrand: {
      type: String,
      trim: true,
      required: function() {
        return this.vehicleDetails?.hasVehicle;
      }
    },
    vehicleColor: {
      type: String,
      trim: true,
      required: function() {
        return this.vehicleDetails?.hasVehicle;
      }
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Created by (for residents, tracks which admin created them)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'resident';
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Hide password in JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Method to get user data for admin view (includes plainTextPassword)
userSchema.methods.toAdminJSON = function() {
  const userObject = this.toObject();
  delete userObject.password; // Still hide the hashed password
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
