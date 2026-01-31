const Meal = require('../models/Meal');
const Product = require('../models/Product');
const DailyLog = require('../models/DailyLog');
const { calculateMealNutrition, calculateProgress } = require('../services/calculationService');
const { paginate, getPaginationMetadata } = require('../utils/pagination');

const getMeals = async (req, res) => {
  try {
    const { startDate, endDate, mealType, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (mealType) {
      query.mealType = mealType;
    }


    const total = await Meal.countDocuments(query);

    const meals = await paginate(
      Meal.find(query).populate('items.product').sort({ date: -1 }),
      parseInt(page),
      parseInt(limit)
    );

    const pagination = await getPaginationMetadata(
      Meal,
      query,
      parseInt(page),
      parseInt(limit),
      total
    );

    res.json({
      success: true,
      count: meals.length,
      pagination,
      data: meals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id).populate('items.product');

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (meal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      data: meal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMeal = async (req, res) => {
  try {
    const { name, mealType, date, items, notes } = req.body;

    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const missingProducts = items.filter(item => !productMap.has(item.product.toString()));
    if (missingProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Продукти не знайдено: ${missingProducts.map(p => p.product).join(', ')}`
      });
    }

    const populatedItems = items.map((item) => {
      const product = productMap.get(item.product.toString());
      const multiplier = item.amount / 100;

      return {
        product: product._id,
        amount: item.amount,
        nutrition: {
          calories: Math.round(product.nutritionPer100g.calories * multiplier),
          protein: Math.round(product.nutritionPer100g.protein * multiplier * 10) / 10,
          fats: Math.round(product.nutritionPer100g.fats * multiplier * 10) / 10,
          carbs: Math.round(product.nutritionPer100g.carbs * multiplier * 10) / 10
        }
      };
    });

    const totalNutrition = populatedItems.reduce((total, item) => ({
      calories: total.calories + item.nutrition.calories,
      protein: Math.round((total.protein + item.nutrition.protein) * 10) / 10,
      fats: Math.round((total.fats + item.nutrition.fats) * 10) / 10,
      carbs: Math.round((total.carbs + item.nutrition.carbs) * 10) / 10
    }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

    const meal = await Meal.create({
      userId: req.user._id,
      name,
      mealType,
      date: date || Date.now(),
      items: populatedItems,
      totalNutrition,
      notes
    });

    await updateDailyLog(req.user._id, meal.date);

    const populatedMeal = await Meal.findById(meal._id).populate('items.product');

    res.status(201).json({
      success: true,
      data: populatedMeal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMeal = async (req, res) => {
  try {
    let meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (meal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, mealType, date, items, notes } = req.body;

    if (items) {
      const productIds = items.map(item => item.product);
      const products = await Product.find({ _id: { $in: productIds } });

      const productMap = new Map(products.map(p => [p._id.toString(), p]));

      const missingProducts = items.filter(item => !productMap.has(item.product.toString()));
      if (missingProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Продукти не знайдено: ${missingProducts.map(p => p.product).join(', ')}`
        });
      }

      const populatedItems = items.map((item) => {
        const product = productMap.get(item.product.toString());
        const multiplier = item.amount / 100;

        return {
          product: product._id,
          amount: item.amount,
          nutrition: {
            calories: Math.round(product.nutritionPer100g.calories * multiplier),
            protein: Math.round(product.nutritionPer100g.protein * multiplier * 10) / 10,
            fats: Math.round(product.nutritionPer100g.fats * multiplier * 10) / 10,
            carbs: Math.round(product.nutritionPer100g.carbs * multiplier * 10) / 10
          }
        };
      });

      const totalNutrition = populatedItems.reduce((total, item) => ({
        calories: total.calories + item.nutrition.calories,
        protein: Math.round((total.protein + item.nutrition.protein) * 10) / 10,
        fats: Math.round((total.fats + item.nutrition.fats) * 10) / 10,
        carbs: Math.round((total.carbs + item.nutrition.carbs) * 10) / 10
      }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

      meal.items = populatedItems;
      meal.totalNutrition = totalNutrition;
    }

    if (name) meal.name = name;
    if (mealType) meal.mealType = mealType;
    if (date) meal.date = date;
    if (notes !== undefined) meal.notes = notes;

    await meal.save();
    await updateDailyLog(req.user._id, meal.date);

    const populatedMeal = await Meal.findById(meal._id).populate('items.product');

    res.json({
      success: true,
      data: populatedMeal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (meal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const mealDate = meal.date;
    await meal.deleteOne();
    await updateDailyLog(req.user._id, mealDate);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDailyLog = async (userId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const result = await Meal.aggregate([
    {
      $match: {
        userId: userId,
        date: {
          $gte: startOfDay,
          $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) // +1 день
        }
      }
    },
    {

      $group: {
        _id: null,
        totalCalories: { $sum: '$totalNutrition.calories' },
        totalProtein: { $sum: '$totalNutrition.protein' },
        totalFats: { $sum: '$totalNutrition.fats' },
        totalCarbs: { $sum: '$totalNutrition.carbs' }
      }
    }
  ]);

 
  const totalNutrition = result.length > 0 ? {
    calories: result[0].totalCalories,
    protein: Math.round(result[0].totalProtein * 10) / 10,
    fats: Math.round(result[0].totalFats * 10) / 10,
    carbs: Math.round(result[0].totalCarbs * 10) / 10
  } : { calories: 0, protein: 0, fats: 0, carbs: 0 };

  const User = require('../models/User');
  const user = await User.findById(userId);

  if (!user || !user.dailyNorms) {
    console.warn(`User ${userId} not found or missing daily norms`);
    return;
  }

  const progress = calculateProgress(totalNutrition, user.dailyNorms);

  await DailyLog.findOneAndUpdate(
    { userId, date: startOfDay },
    {
      totalNutrition,
      dailyNorms: user.dailyNorms,
      progress
    },
    { upsert: true, new: true }
  );
};

module.exports = {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal
};
