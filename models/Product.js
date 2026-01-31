const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  category: {
    type: String,
    enum: ['vegetables', 'fruits', 'meat', 'fish', 'dairy', 'grains', 'legumes', 'nuts', 'sweets', 'beverages', 'other'],
    default: 'other'
  },
  nutritionPer100g: {
    calories: {
      type: Number,
      required: true
    },
    protein: {
      type: Number,
      required: true
    },
    fats: {
      type: Number,
      required: true
    },
    carbs: {
      type: Number,
      required: true
    },
    fiber: {
      type: Number,
      default: 0
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
