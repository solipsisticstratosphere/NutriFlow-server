const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Meal = require('../models/Meal');
const DailyLog = require('../models/DailyLog');

const users = [
  {
    name: 'Олена Коваленко',
    email: 'olena@example.com',
    password: 'Test123',
    profile: {
      age: 28,
      gender: 'female',
      weight: 62,
      height: 168,
      activityLevel: 'moderate',
      goal: 'lose_weight'
    }
  },
  {
    name: 'Андрій Шевченко',
    email: 'andriy@example.com',
    password: 'Test123',
    profile: {
      age: 32,
      gender: 'male',
      weight: 85,
      height: 182,
      activityLevel: 'active',
      goal: 'gain_muscle'
    }
  },
  {
    name: 'Марія Іваненко',
    email: 'maria@example.com',
    password: 'Test123',
    profile: {
      age: 25,
      gender: 'female',
      weight: 58,
      height: 165,
      activityLevel: 'light',
      goal: 'maintain'
    }
  }
];


const products = [
  { name: 'Помідор', category: 'vegetables', nutritionPer100g: { calories: 18, protein: 0.9, fats: 0.2, carbs: 3.9, fiber: 1.2 }, isPublic: true },
  { name: 'Огірок', category: 'vegetables', nutritionPer100g: { calories: 15, protein: 0.8, fats: 0.1, carbs: 3.6, fiber: 0.5 }, isPublic: true },
  { name: 'Морква', category: 'vegetables', nutritionPer100g: { calories: 41, protein: 0.9, fats: 0.2, carbs: 9.6, fiber: 2.8 }, isPublic: true },
  { name: 'Капуста білокачанна', category: 'vegetables', nutritionPer100g: { calories: 25, protein: 1.3, fats: 0.1, carbs: 5.8, fiber: 2.5 }, isPublic: true },
  { name: 'Цибуля ріпчаста', category: 'vegetables', nutritionPer100g: { calories: 40, protein: 1.1, fats: 0.1, carbs: 8.6, fiber: 1.7 }, isPublic: true },
  { name: 'Перець болгарський', category: 'vegetables', nutritionPer100g: { calories: 27, protein: 1.3, fats: 0.3, carbs: 5.3, fiber: 2.1 }, isPublic: true },

  { name: 'Банан', category: 'fruits', nutritionPer100g: { calories: 89, protein: 1.1, fats: 0.3, carbs: 22.8, fiber: 2.6 }, isPublic: true },
  { name: 'Яблуко', category: 'fruits', nutritionPer100g: { calories: 52, protein: 0.3, fats: 0.2, carbs: 13.8, fiber: 2.4 }, isPublic: true },
  { name: 'Апельсин', category: 'fruits', nutritionPer100g: { calories: 47, protein: 0.9, fats: 0.1, carbs: 11.8, fiber: 2.4 }, isPublic: true },
  { name: 'Груша', category: 'fruits', nutritionPer100g: { calories: 57, protein: 0.4, fats: 0.1, carbs: 15.2, fiber: 3.1 }, isPublic: true },

  { name: 'Куряча грудка', category: 'meat', nutritionPer100g: { calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0 }, isPublic: true },
  { name: 'Яловичина', category: 'meat', nutritionPer100g: { calories: 250, protein: 26, fats: 15, carbs: 0, fiber: 0 }, isPublic: true },
  { name: 'Свинина нежирна', category: 'meat', nutritionPer100g: { calories: 242, protein: 21.3, fats: 17.2, carbs: 0, fiber: 0 }, isPublic: true },
  { name: 'Індичка', category: 'meat', nutritionPer100g: { calories: 189, protein: 21.6, fats: 12, carbs: 0, fiber: 0 }, isPublic: true },

  { name: 'Лосось', category: 'fish', nutritionPer100g: { calories: 208, protein: 20, fats: 13, carbs: 0, fiber: 0 }, isPublic: true },
  { name: 'Тунець', category: 'fish', nutritionPer100g: { calories: 144, protein: 23.3, fats: 4.9, carbs: 0, fiber: 0 }, isPublic: true },
  { name: 'Треска', category: 'fish', nutritionPer100g: { calories: 82, protein: 17.8, fats: 0.7, carbs: 0, fiber: 0 }, isPublic: true },

  { name: 'Молоко 2.5%', category: 'dairy', nutritionPer100g: { calories: 52, protein: 2.8, fats: 2.5, carbs: 4.7, fiber: 0 }, isPublic: true },
  { name: 'Кефір 2.5%', category: 'dairy', nutritionPer100g: { calories: 51, protein: 3, fats: 2.5, carbs: 4, fiber: 0 }, isPublic: true },
  { name: 'Творог 5%', category: 'dairy', nutritionPer100g: { calories: 121, protein: 16.5, fats: 5, carbs: 3, fiber: 0 }, isPublic: true },
  { name: 'Йогурт натуральний', category: 'dairy', nutritionPer100g: { calories: 66, protein: 5, fats: 3.2, carbs: 4.7, fiber: 0 }, isPublic: true },
  { name: 'Сир твердий', category: 'dairy', nutritionPer100g: { calories: 364, protein: 26, fats: 28, carbs: 0, fiber: 0 }, isPublic: true },

  { name: 'Гречка (варена)', category: 'grains', nutritionPer100g: { calories: 123, protein: 4.2, fats: 1.1, carbs: 25, fiber: 2.7 }, isPublic: true },
  { name: 'Рис (варений)', category: 'grains', nutritionPer100g: { calories: 130, protein: 2.7, fats: 0.3, carbs: 28.2, fiber: 0.4 }, isPublic: true },
  { name: 'Вівсянка (варена)', category: 'grains', nutritionPer100g: { calories: 88, protein: 3, fats: 1.7, carbs: 15.4, fiber: 1.7 }, isPublic: true },
  { name: 'Хліб житній', category: 'grains', nutritionPer100g: { calories: 259, protein: 8.5, fats: 1.2, carbs: 48.3, fiber: 8.3 }, isPublic: true },
  { name: 'Макарони (варені)', category: 'grains', nutritionPer100g: { calories: 158, protein: 5.8, fats: 0.9, carbs: 30.9, fiber: 1.8 }, isPublic: true },

  { name: 'Квасоля (варена)', category: 'legumes', nutritionPer100g: { calories: 127, protein: 8.7, fats: 0.5, carbs: 22.8, fiber: 6.4 }, isPublic: true },
  { name: 'Сочевиця (варена)', category: 'legumes', nutritionPer100g: { calories: 116, protein: 9, fats: 0.4, carbs: 20.1, fiber: 7.9 }, isPublic: true },
  { name: 'Нут (варений)', category: 'legumes', nutritionPer100g: { calories: 164, protein: 8.9, fats: 2.6, carbs: 27.4, fiber: 7.6 }, isPublic: true },

  { name: 'Грецький горіх', category: 'nuts', nutritionPer100g: { calories: 654, protein: 15.2, fats: 65.2, carbs: 7, fiber: 6.7 }, isPublic: true },
  { name: 'Мигдаль', category: 'nuts', nutritionPer100g: { calories: 579, protein: 21.2, fats: 49.9, carbs: 21.6, fiber: 12.5 }, isPublic: true },


  { name: 'Яйце куряче', category: 'other', nutritionPer100g: { calories: 155, protein: 12.7, fats: 11.5, carbs: 0.7, fiber: 0 }, isPublic: true },
  { name: 'Олія оливкова', category: 'other', nutritionPer100g: { calories: 884, protein: 0, fats: 100, carbs: 0, fiber: 0 }, isPublic: true }
];

const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');


    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Meal.deleteMany({});
    await DailyLog.deleteMany({});
    console.log('✅ Data cleared\n');


    console.log('👥 Creating users...');
    const createdUsers = [];

    for (const userData of users) {
      
      const user = await User.create(userData);

      createdUsers.push(user);
      console.log(`   ✓ Created user: ${user.name} (${user.email})`);
    }


    console.log('\n🍎 Creating products...');
    const createdProducts = await Product.insertMany(products);
    console.log(`   ✓ Created ${createdProducts.length} products`);

    
    console.log('\n🍽️  Creating sample meals for Olena...');
    const user = createdUsers[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    const breakfastProducts = [
      { product: createdProducts.find(p => p.name === 'Вівсянка (варена)'), amount: 200 },
      { product: createdProducts.find(p => p.name === 'Банан'), amount: 120 },
      { product: createdProducts.find(p => p.name === 'Молоко 2.5%'), amount: 150 }
    ];

    const breakfastItems = breakfastProducts.map(item => ({
      product: item.product._id,
      amount: item.amount,
      nutrition: {
        calories: (item.product.nutritionPer100g.calories * item.amount) / 100,
        protein: (item.product.nutritionPer100g.protein * item.amount) / 100,
        fats: (item.product.nutritionPer100g.fats * item.amount) / 100,
        carbs: (item.product.nutritionPer100g.carbs * item.amount) / 100
      }
    }));

    const breakfastNutrition = breakfastItems.reduce((acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: acc.protein + item.nutrition.protein,
      fats: acc.fats + item.nutrition.fats,
      carbs: acc.carbs + item.nutrition.carbs
    }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

    const breakfast = await Meal.create({
      userId: user._id,
      name: 'Сніданок',
      mealType: 'breakfast',
      date: new Date(today.getTime() + 8 * 60 * 60 * 1000),
      items: breakfastItems,
      totalNutrition: breakfastNutrition
    });

    console.log(`   ✓ Created breakfast: ${Math.round(breakfastNutrition.calories)} kcal`);


    const lunchProducts = [
      { product: createdProducts.find(p => p.name === 'Куряча грудка'), amount: 150 },
      { product: createdProducts.find(p => p.name === 'Гречка (варена)'), amount: 200 },
      { product: createdProducts.find(p => p.name === 'Огірок'), amount: 100 },
      { product: createdProducts.find(p => p.name === 'Помідор'), amount: 100 }
    ];

    const lunchItems = lunchProducts.map(item => ({
      product: item.product._id,
      amount: item.amount,
      nutrition: {
        calories: (item.product.nutritionPer100g.calories * item.amount) / 100,
        protein: (item.product.nutritionPer100g.protein * item.amount) / 100,
        fats: (item.product.nutritionPer100g.fats * item.amount) / 100,
        carbs: (item.product.nutritionPer100g.carbs * item.amount) / 100
      }
    }));

    const lunchNutrition = lunchItems.reduce((acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: acc.protein + item.nutrition.protein,
      fats: acc.fats + item.nutrition.fats,
      carbs: acc.carbs + item.nutrition.carbs
    }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

    const lunch = await Meal.create({
      userId: user._id,
      name: 'Обід',
      mealType: 'lunch',
      date: new Date(today.getTime() + 13 * 60 * 60 * 1000),
      items: lunchItems,
      totalNutrition: lunchNutrition
    });

    console.log(`   ✓ Created lunch: ${Math.round(lunchNutrition.calories)} kcal`);


    const dinnerProducts = [
      { product: createdProducts.find(p => p.name === 'Лосось'), amount: 120 },
      { product: createdProducts.find(p => p.name === 'Рис (варений)'), amount: 150 },
      { product: createdProducts.find(p => p.name === 'Перець болгарський'), amount: 80 }
    ];

    const dinnerItems = dinnerProducts.map(item => ({
      product: item.product._id,
      amount: item.amount,
      nutrition: {
        calories: (item.product.nutritionPer100g.calories * item.amount) / 100,
        protein: (item.product.nutritionPer100g.protein * item.amount) / 100,
        fats: (item.product.nutritionPer100g.fats * item.amount) / 100,
        carbs: (item.product.nutritionPer100g.carbs * item.amount) / 100
      }
    }));

    const dinnerNutrition = dinnerItems.reduce((acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: acc.protein + item.nutrition.protein,
      fats: acc.fats + item.nutrition.fats,
      carbs: acc.carbs + item.nutrition.carbs
    }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

    const dinner = await Meal.create({
      userId: user._id,
      name: 'Вечеря',
      mealType: 'dinner',
      date: new Date(today.getTime() + 19 * 60 * 60 * 1000),
      items: dinnerItems,
      totalNutrition: dinnerNutrition
    });

    console.log(`   ✓ Created dinner: ${Math.round(dinnerNutrition.calories)} kcal`);


    console.log('\n📊 Creating daily log...');
    const totalNutrition = {
      calories: breakfastNutrition.calories + lunchNutrition.calories + dinnerNutrition.calories,
      protein: breakfastNutrition.protein + lunchNutrition.protein + dinnerNutrition.protein,
      fats: breakfastNutrition.fats + lunchNutrition.fats + dinnerNutrition.fats,
      carbs: breakfastNutrition.carbs + lunchNutrition.carbs + dinnerNutrition.carbs
    };

    await DailyLog.create({
      userId: user._id,
      date: today,
      totalNutrition
    });

    console.log(`   ✓ Daily total: ${Math.round(totalNutrition.calories)} kcal`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📝 Test accounts:');
    users.forEach(u => {
      console.log(`   Email: ${u.email}, Password: Test123`);
    });
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
