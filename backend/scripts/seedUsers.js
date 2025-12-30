import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/focus-forge');
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create test users
    const testUsers = [
      {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      },
      {
        email: 'john.doe@example.com',
        password: 'password123',
        fullName: 'John Doe',
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123',
        fullName: 'Jane Smith',
      },
    ];

    // Hash passwords and insert users
    for (let user of testUsers) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    await User.insertMany(testUsers);
    console.log(`${testUsers.length} users created successfully\n`);

    // Display created users with their test credentials
    console.log('Test Credentials:');
    console.log('================');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('');
    console.log('Email: john.doe@example.com');
    console.log('Password: password123');
    console.log('');
    console.log('Email: jane.smith@example.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
