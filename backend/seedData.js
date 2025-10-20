const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const sampleResidents = [
  {
    username: 'john_doe',
    password: 'password123',
    plainTextPassword: 'password123',
    fullName: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1234567890',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    roomNumber: '101',
    floor: 1,
    emergencyContact: {
      name: 'Mary Doe',
      phone: '+1234567891',
      relationship: 'Mother'
    },
    vehicleDetails: {
      hasVehicle: true,
      vehicleType: 'bike',
      vehicleNumber: 'MH01AB1234',
      vehicleBrand: 'Honda',
      vehicleColor: 'Red'
    }
  },
  {
    username: 'jane_smith',
    password: 'password123',
    plainTextPassword: 'password123',
    fullName: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+1234567892',
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b282?w=150&h=150&fit=crop&crop=face',
    roomNumber: '102',
    floor: 1,
    emergencyContact: {
      name: 'Robert Smith',
      phone: '+1234567893',
      relationship: 'Father'
    },
    vehicleDetails: {
      hasVehicle: false
    }
  },
  {
    username: 'mike_wilson',
    password: 'password123',
    plainTextPassword: 'password123',
    fullName: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    phone: '+1234567894',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    roomNumber: '201',
    floor: 2,
    emergencyContact: {
      name: 'Sarah Wilson',
      phone: '+1234567895',
      relationship: 'Sister'
    },
    vehicleDetails: {
      hasVehicle: true,
      vehicleType: 'car',
      vehicleNumber: 'MH02CD5678',
      vehicleBrand: 'Maruti',
      vehicleColor: 'White'
    }
  },
  {
    username: 'emily_brown',
    password: 'password123',
    plainTextPassword: 'password123',
    fullName: 'Emily Brown',
    email: 'emily.brown@email.com',
    phone: '+1234567896',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    roomNumber: '202',
    floor: 2,
    emergencyContact: {
      name: 'David Brown',
      phone: '+1234567897',
      relationship: 'Father'
    },
    vehicleDetails: {
      hasVehicle: true,
      vehicleType: 'scooter',
      vehicleNumber: 'MH03EF9012',
      vehicleBrand: 'Activa',
      vehicleColor: 'Blue'
    }
  },
  {
    username: 'alex_johnson',
    password: 'password123',
    plainTextPassword: 'password123',
    fullName: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1234567898',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    roomNumber: '301',
    floor: 3,
    emergencyContact: {
      name: 'Lisa Johnson',
      phone: '+1234567899',
      relationship: 'Mother'
    },
    vehicleDetails: {
      hasVehicle: false
    }
  }
];

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/society360');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = new User({
      username: 'watchman',
      password: 'watchman123',
      role: 'admin'
    });

    const savedAdmin = await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Username: watchman');
    console.log('   Password: watchman123');

    // Create sample residents
    console.log('\n📝 Creating sample residents...');
    
    for (const residentData of sampleResidents) {
      const resident = new User({
        ...residentData,
        role: 'resident',
        createdBy: savedAdmin._id
      });
      
      await resident.save();
      console.log(`✅ Created resident: ${residentData.fullName} (${residentData.username})`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('\n👨‍💼 ADMIN (Watchman):');
    console.log('   Username: watchman');
    console.log('   Password: watchman123');
    
    console.log('\n👥 SAMPLE RESIDENTS:');
    sampleResidents.forEach(resident => {
      console.log(`   👤 ${resident.fullName}:`);
      console.log(`      Username: ${resident.username}`);
      console.log(`      Password: password123`);
      console.log(`      Room: ${resident.roomNumber} (Floor ${resident.floor})`);
      console.log('');
    });

    console.log('🚀 You can now run "npm run dev" to start the application!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
