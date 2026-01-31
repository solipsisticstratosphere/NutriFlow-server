const DailyLog = require('../models/DailyLog');
const Meal = require('../models/Meal');
const { generateRecommendations, generateWeeklySummary } = require('../services/recommendationService');

const getDailyLog = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);

    let dailyLog = await DailyLog.findOne({
      userId: req.user._id,
      date: date
    });

    if (!dailyLog) {
      dailyLog = await DailyLog.create({
        userId: req.user._id,
        date: date,
        totalNutrition: { calories: 0, protein: 0, fats: 0, carbs: 0 },
        dailyNorms: req.user.dailyNorms,
        progress: { caloriesPercent: 0, proteinPercent: 0, fatsPercent: 0, carbsPercent: 0 }
      });
    }

    const recommendations = generateRecommendations(dailyLog, req.user);

    res.json({
      success: true,
      data: {
        ...dailyLog.toObject(),
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWeeklyStats = async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const dailyLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const summary = generateWeeklySummary(dailyLogs);

    res.json({
      success: true,
      data: {
        logs: dailyLogs,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMonthlyStats = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const dailyLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const totalDays = dailyLogs.length;
    const averages = dailyLogs.reduce((acc, log) => ({
      calories: acc.calories + log.totalNutrition.calories,
      protein: acc.protein + log.totalNutrition.protein,
      fats: acc.fats + log.totalNutrition.fats,
      carbs: acc.carbs + log.totalNutrition.carbs
    }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

    const summary = totalDays > 0 ? {
      averageCalories: Math.round(averages.calories / totalDays),
      averageProtein: Math.round(averages.protein / totalDays),
      averageFats: Math.round(averages.fats / totalDays),
      averageCarbs: Math.round(averages.carbs / totalDays),
      daysTracked: totalDays,
      consistency: Math.round((totalDays / endDate.getDate()) * 100)
    } : null;

    res.json({
      success: true,
      data: {
        logs: dailyLogs,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProgressChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const chartData = dailyLogs.map(log => ({
      date: log.date,
      calories: log.totalNutrition.calories,
      protein: log.totalNutrition.protein,
      fats: log.totalNutrition.fats,
      carbs: log.totalNutrition.carbs,
      caloriesTarget: log.dailyNorms.calories,
      weight: log.weight
    }));

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDailyLog = async (req, res) => {
  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const dailyLog = await DailyLog.findOneAndUpdate(
      { userId: req.user._id, date: date },
      {
        waterIntake: req.body.waterIntake,
        weight: req.body.weight,
        notes: req.body.notes
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: dailyLog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMealsByCategory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const meals = await Meal.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const mealTypeStats = meals.reduce((acc, meal) => {
      if (!acc[meal.mealType]) {
        acc[meal.mealType] = {
          count: 0,
          totalCalories: 0,
          totalProtein: 0,
          totalFats: 0,
          totalCarbs: 0
        };
      }

      acc[meal.mealType].count++;
      acc[meal.mealType].totalCalories += meal.totalNutrition.calories;
      acc[meal.mealType].totalProtein += meal.totalNutrition.protein;
      acc[meal.mealType].totalFats += meal.totalNutrition.fats;
      acc[meal.mealType].totalCarbs += meal.totalNutrition.carbs;

      return acc;
    }, {});

    res.json({
      success: true,
      data: mealTypeStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDailyLog,
  getWeeklyStats,
  getMonthlyStats,
  getProgressChart,
  updateDailyLog,
  getMealsByCategory
};
