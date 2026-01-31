const calculateBMR = (weight, height, age, gender) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  return bmr * (activityMultipliers[activityLevel] || 1.55);
};

const calculateDailyNorms = (user) => {
  const { weight, height, age, gender, activityLevel, goal } = user.profile;

  if (!weight || !height || !age) {
    return null;
  }

  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);

  let calories = tdee;
  if (goal === 'lose_weight') {
    calories = tdee - 500;
  } else if (goal === 'gain_weight' || goal === 'gain_muscle') {
    calories = tdee + 300;
  }

  let protein, fats, carbs;

  if (goal === 'gain_muscle') {
    protein = weight * 2.0;
    fats = (calories * 0.25) / 9;
    carbs = (calories - (protein * 4) - (fats * 9)) / 4;
  } else if (goal === 'lose_weight') {
    protein = weight * 1.8;
    fats = (calories * 0.25) / 9;
    carbs = (calories - (protein * 4) - (fats * 9)) / 4;
  } else {
    protein = weight * 1.5;
    fats = (calories * 0.30) / 9;
    carbs = (calories - (protein * 4) - (fats * 9)) / 4;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fats: Math.round(fats),
    carbs: Math.round(carbs)
  };
};

const calculateMealNutrition = (items) => {
  return items.reduce((total, item) => {
    const multiplier = item.amount / 100;
    return {
      calories: total.calories + (item.product.nutritionPer100g.calories * multiplier),
      protein: total.protein + (item.product.nutritionPer100g.protein * multiplier),
      fats: total.fats + (item.product.nutritionPer100g.fats * multiplier),
      carbs: total.carbs + (item.product.nutritionPer100g.carbs * multiplier)
    };
  }, { calories: 0, protein: 0, fats: 0, carbs: 0 });
};

const calculateProgress = (consumed, norms) => {
  return {
    caloriesPercent: Math.round((consumed.calories / norms.calories) * 100),
    proteinPercent: Math.round((consumed.protein / norms.protein) * 100),
    fatsPercent: Math.round((consumed.fats / norms.fats) * 100),
    carbsPercent: Math.round((consumed.carbs / norms.carbs) * 100)
  };
};

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateDailyNorms,
  calculateMealNutrition,
  calculateProgress
};
