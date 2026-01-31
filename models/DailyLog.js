const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalNutrition: {
    calories: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    fats: {
      type: Number,
      default: 0
    },
    carbs: {
      type: Number,
      default: 0
    }
  },
  dailyNorms: {
    calories: Number,
    protein: Number,
    fats: Number,
    carbs: Number
  },
  progress: {
    caloriesPercent: Number,
    proteinPercent: Number,
    fatsPercent: Number,
    carbsPercent: Number
  },
  waterIntake: {
    type: Number,
    default: 0
  },
  weight: Number,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

dailyLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
