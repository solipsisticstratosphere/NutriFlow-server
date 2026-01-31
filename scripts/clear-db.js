const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Meal = require('../models/Meal');
const DailyLog = require('../models/DailyLog');

const clearDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing database...\n');

  
    const collections = [
      { name: 'Users', model: User },
      { name: 'Products', model: Product },
      { name: 'Meals', model: Meal },
      { name: 'DailyLogs', model: DailyLog }
    ];

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      await collection.model.deleteMany({});
      console.log(`   ✓ Deleted ${count} ${collection.name}`);
    }

    console.log('\n✅ Database cleared successfully!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();
