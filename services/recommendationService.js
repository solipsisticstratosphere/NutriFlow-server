const generateRecommendations = (dailyLog, user) => {
  const recommendations = [];
  const { totalNutrition, dailyNorms, progress } = dailyLog;

  if (progress.caloriesPercent < 80) {
    recommendations.push({
      type: 'warning',
      category: 'calories',
      message: 'Ви споживаєте менше калорій, ніж потрібно. Це може сповільнити метаболізм.',
      suggestion: 'Додайте ще один перекус або збільште порції.'
    });
  } else if (progress.caloriesPercent > 120) {
    recommendations.push({
      type: 'warning',
      category: 'calories',
      message: 'Ви перевищили денну норму калорій.',
      suggestion: 'Зменшіть порції або оберіть менш калорійні продукти.'
    });
  } else {
    recommendations.push({
      type: 'success',
      category: 'calories',
      message: 'Відмінно! Ви дотримуєтесь калорійності.',
      suggestion: ''
    });
  }

  if (progress.proteinPercent < 80) {
    recommendations.push({
      type: 'warning',
      category: 'protein',
      message: 'Недостатньо білка в раціоні.',
      suggestion: 'Додайте м\'ясо, рибу, яйця, бобові або молочні продукти.'
    });
  } else if (progress.proteinPercent > 150) {
    recommendations.push({
      type: 'info',
      category: 'protein',
      message: 'Високий рівень білка.',
      suggestion: 'Переконайтесь, що п\'єте достатньо води.'
    });
  }

  if (progress.carbsPercent < 70) {
    recommendations.push({
      type: 'info',
      category: 'carbs',
      message: 'Низький рівень вуглеводів.',
      suggestion: 'Додайте цільнозернові продукти, фрукти або овочі для енергії.'
    });
  } else if (progress.carbsPercent > 130) {
    recommendations.push({
      type: 'warning',
      category: 'carbs',
      message: 'Забагато вуглеводів.',
      suggestion: 'Зменште вживання солодощів та борошняних виробів.'
    });
  }

  if (progress.fatsPercent < 60) {
    recommendations.push({
      type: 'warning',
      category: 'fats',
      message: 'Недостатньо жирів.',
      suggestion: 'Додайте горіхи, авокадо, олію або жирну рибу.'
    });
  } else if (progress.fatsPercent > 140) {
    recommendations.push({
      type: 'warning',
      category: 'fats',
      message: 'Занадто багато жирів.',
      suggestion: 'Обмежте смажене та жирні продукти.'
    });
  }

  const macroBalance = checkMacroBalance(totalNutrition, dailyNorms);
  if (macroBalance) {
    recommendations.push(macroBalance);
  }

  return recommendations;
};

const checkMacroBalance = (consumed, norms) => {
  const proteinCals = consumed.protein * 4;
  const fatsCals = consumed.fats * 9;
  const carbsCals = consumed.carbs * 4;
  const totalCals = proteinCals + fatsCals + carbsCals;

  if (totalCals === 0) return null;

  const proteinPercent = (proteinCals / totalCals) * 100;
  const fatsPercent = (fatsCals / totalCals) * 100;
  const carbsPercent = (carbsCals / totalCals) * 100;

  if (proteinPercent >= 25 && proteinPercent <= 35 &&
      fatsPercent >= 20 && fatsPercent <= 35 &&
      carbsPercent >= 40 && carbsPercent <= 55) {
    return {
      type: 'success',
      category: 'balance',
      message: 'Відмінний баланс макронутрієнтів!',
      suggestion: 'Продовжуйте в тому ж дусі.'
    };
  }

  return {
    type: 'info',
    category: 'balance',
    message: 'Спробуйте збалансувати раціон.',
    suggestion: `Поточний розподіл: білки ${proteinPercent.toFixed(0)}%, жири ${fatsPercent.toFixed(0)}%, вуглеводи ${carbsPercent.toFixed(0)}%.`
  };
};

const generateWeeklySummary = (weeklyLogs) => {
  if (!weeklyLogs || weeklyLogs.length === 0) {
    return null;
  }

  const averages = weeklyLogs.reduce((acc, log) => {
    return {
      calories: acc.calories + log.totalNutrition.calories,
      protein: acc.protein + log.totalNutrition.protein,
      fats: acc.fats + log.totalNutrition.fats,
      carbs: acc.carbs + log.totalNutrition.carbs
    };
  }, { calories: 0, protein: 0, fats: 0, carbs: 0 });

  const daysCount = weeklyLogs.length;

  return {
    averageCalories: Math.round(averages.calories / daysCount),
    averageProtein: Math.round(averages.protein / daysCount),
    averageFats: Math.round(averages.fats / daysCount),
    averageCarbs: Math.round(averages.carbs / daysCount),
    daysTracked: daysCount
  };
};

module.exports = {
  generateRecommendations,
  generateWeeklySummary
};
