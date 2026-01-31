const User = require('../models/User');
const Product = require('../models/Product');
const Meal = require('../models/Meal');
const DailyLog = require('../models/DailyLog');

/**
 * Створює оптимальні індекси для всіх колекцій
 * Викликається при старті сервера
 */
const createIndexes = async () => {
  try {
    console.log('Creating database indexes...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('✓ User indexes created');

    // Product indexes
    await Product.collection.createIndex({ userId: 1 });
    await Product.collection.createIndex({ isPublic: 1 });
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ userId: 1, category: 1 }); // Compound index
    // Text search index already exists in model (name field)
    console.log('✓ Product indexes created');

    // Meal indexes
    await Meal.collection.createIndex({ userId: 1, date: -1 });
    await Meal.collection.createIndex({ userId: 1, mealType: 1 });
    await Meal.collection.createIndex({ userId: 1, date: -1, mealType: 1 }); // Compound index
    console.log('✓ Meal indexes created');

    // DailyLog indexes - оптимізація для range queries
    await DailyLog.collection.createIndex({ userId: 1, date: 1 }, { unique: true });
    console.log('✓ DailyLog indexes created');

    console.log('✅ All database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
};

module.exports = createIndexes;
