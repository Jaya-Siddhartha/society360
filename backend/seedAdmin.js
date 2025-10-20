const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/society360');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username:', existingAdmin.username);
      process.exit(0);
    }

    // Create default admin
    const admin = new User({
      username: 'watchman',
      password: 'watchman123', // This will be hashed automatically
      role: 'admin'
    });

    await admin.save();
    
    console.log('Default admin user created successfully!');
    console.log('Username: watchman');
    console.log('Password: watchman123');
    console.log('\nYou can now login to the admin panel with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
