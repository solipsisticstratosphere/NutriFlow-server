const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Meal = require('../models/Meal');
const DailyLog = require('../models/DailyLog');

const uri = process.env.TEST_MONGODB_URI;

if (!uri) {
  console.error('❌ TEST_MONGODB_URI не знайдено в .env');
  console.error('   Додайте TEST_MONGODB_URI=...nutriflow-test... у файл .env');
  process.exit(1);
}

if (!uri.includes('test')) {
  console.error('❌ TEST_MONGODB_URI не містить "test" у назві бази даних.');
  console.error('   Переконайтеся, що URI вказує на тестову базу (наприклад: nutriflow-test)');
  process.exit(1);
}

const clearDatabase = async () => {
  try {
    console.log('🔌 Connecting to TEST MongoDB...');
    await mongoose.connect(uri);
    console.log(`✅ Connected to: ${mongoose.connection.name}\n`);

    console.log('🗑️  Clearing test database...\n');

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

    console.log('\n✅ Test database cleared successfully!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();
