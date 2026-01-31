// Використовуємо unified AI service з кешуванням та fallback на Gemini
const {
  analyzeProductByName,
  analyzeDailyDiet,
  analyzeWeeklyDiet,
  getPersonalizedSuggestions
} = require('../services/aiService');
const DailyLog = require('../models/DailyLog');
const Meal = require('../models/Meal');
const Product = require('../models/Product');

const recognizeProduct = async (req, res) => {
  try {
    const { productName } = req.body;

    if (!productName || productName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Назва продукту має містити щонайменше 2 символи'
      });
    }

    const result = await analyzeProductByName(productName);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in recognizeProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при розпізнаванні продукту'
    });
  }
};

const createProductFromAI = async (req, res) => {
  try {
    const { productName } = req.body;

    if (!productName || productName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Назва продукту має містити щонайменше 2 символи'
      });
    }

    const aiResult = await analyzeProductByName(productName);

    if (!aiResult.success) {
      return res.status(400).json(aiResult);
    }

    // Маппінг українських категорій на англійські enum значення
    const categoryMapping = {
      'овочі': 'vegetables',
      'фрукти': 'fruits',
      'м\'ясо': 'meat',
      'риба': 'fish',
      'молочні продукти': 'dairy',
      'молочні': 'dairy',
      'крупи': 'grains',
      'зернові': 'grains',
      'бобові': 'legumes',
      'горіхи': 'nuts',
      'солодощі': 'sweets',
      'напої': 'beverages',
      'інше': 'other'
    };

    const aiCategory = aiResult.data.category?.toLowerCase() || '';
    const mappedCategory = categoryMapping[aiCategory] ||
                          (Object.values(categoryMapping).includes(aiCategory) ? aiCategory : 'other');

    const product = await Product.create({
      name: aiResult.data.name,
      category: mappedCategory,
      nutritionPer100g: aiResult.data.nutritionPer100g,
      userId: req.user._id,
      isPublic: false
    });

    res.status(201).json({
      success: true,
      data: {
        product,
        aiDescription: aiResult.data.description
      }
    });
  } catch (error) {
    console.error('Error in createProductFromAI:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні продукту'
    });
  }
};

const analyzeDailyDietAI = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const dailyLog = await DailyLog.findOne({
      userId: req.user._id,
      date: date
    });

    if (!dailyLog) {
      return res.status(404).json({
        success: false,
        message: 'Дані за цей день не знайдено'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('items.product');

    if (meals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Немає даних про прийоми їжі за цей день'
      });
    }

    const analysis = await analyzeDailyDiet(dailyLog, meals, req.user);

    if (!analysis.success) {
      return res.status(400).json(analysis);
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error in analyzeDailyDietAI:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при аналізі денного раціону'
    });
  }
};

const analyzeWeeklyDietAI = async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const weeklyLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    if (weeklyLogs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Немає даних за цей період'
      });
    }

    const analysis = await analyzeWeeklyDiet(weeklyLogs, req.user);

    if (!analysis.success) {
      return res.status(400).json(analysis);
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error in analyzeWeeklyDietAI:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при аналізі тижневого раціону'
    });
  }
};

const getPersonalizedSuggestionsAI = async (req, res) => {
  try {
    const recentMeals = await Meal.find({
      userId: req.user._id
    })
    .populate('items.product')
    .sort({ date: -1 })
    .limit(20);

    if (recentMeals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Недостатньо даних для генерації рекомендацій'
      });
    }

    const suggestions = await getPersonalizedSuggestions(req.user, recentMeals);

    if (!suggestions.success) {
      return res.status(400).json(suggestions);
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Error in getPersonalizedSuggestionsAI:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при генерації рекомендацій'
    });
  }
};

module.exports = {
  recognizeProduct,
  createProductFromAI,
  analyzeDailyDietAI,
  analyzeWeeklyDietAI,
  getPersonalizedSuggestionsAI
};
