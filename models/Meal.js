const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  nutrition: {
    calories: Number,
    protein: Number,
    fats: Number,
    carbs: Number
  }
});

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a meal name'],
    trim: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [mealItemSchema],
  totalNutrition: {
    calories: Number,
    protein: Number,
    fats: Number,
    carbs: Number
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

mealSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Meal', mealSchema);
