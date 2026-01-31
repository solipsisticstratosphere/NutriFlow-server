const https = require('https');


const HF_ROUTER_URL = 'https://router.huggingface.co/v1';

const HF_MODEL = 'Qwen/Qwen2.5-7B-Instruct';

const callHuggingFaceAPIWithMessages = async (systemPrompt, userPrompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      reject(new Error('HUGGINGFACE_API_KEY не найден в .env'));
      return;
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    let data;
    try {
      data = JSON.stringify({
        model: HF_MODEL,
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7
      });
      
      JSON.parse(data);
    } catch (stringifyError) {
      console.error('JSON.stringify/parse error:', stringifyError);
      console.error('System prompt length:', systemPrompt?.length || 0);
      console.error('User prompt length:', userPrompt?.length || 0);
      console.error('User prompt preview:', userPrompt?.substring(0, 200));
      reject(new Error(`Failed to stringify request: ${stringifyError.message}`));
      return;
    }

    const options = {
      hostname: 'router.huggingface.co',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data, 'utf8')
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          
          if (res.statusCode === 200) {
            if (parsed.choices && parsed.choices.length > 0) {
              const content = parsed.choices[0].message?.content || parsed.choices[0].text || '';
              resolve(content);
            } else if (parsed.generated_text) {
              resolve(parsed.generated_text);
            } else if (parsed.text) {
              resolve(parsed.text);
            } else {
              resolve(JSON.stringify(parsed));
            }
          } else if (res.statusCode === 503) {
            reject(new Error('Модель загружается, попробуйте через несколько секунд'));
          } else {
            const errorMsg = parsed.error?.message || parsed.error || body;
            console.error(`Hugging Face API Error ${res.statusCode}:`, errorMsg);
            console.error('Full response:', body.substring(0, 500));
            if (res.statusCode === 400 && errorMsg.includes('JSON')) {
              console.error('Request data length:', data.length);
              console.error('Request data preview:', data.substring(0, 300));
            }
            reject(new Error(`API Error: ${res.statusCode} - ${errorMsg}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}. Response: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

const callHuggingFaceAPI = async (prompt) => {
  return callHuggingFaceAPIWithMessages(null, prompt);
};

const parseJSONResponse = (response) => {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response format');
  }

  let cleaned = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const startIndex = cleaned.indexOf('{');
  if (startIndex === -1) {
    console.error('No JSON object found in response:', response.substring(0, 500));
    throw new Error('Failed to parse AI response - no JSON object found');
  }


  let braceCount = 0;
  let endIndex = -1;
  for (let i = startIndex; i < cleaned.length; i++) {
    if (cleaned[i] === '{') braceCount++;
    if (cleaned[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (endIndex === -1) {
    cleaned += '}';
    endIndex = cleaned.length;
  }

  let jsonString = cleaned.substring(startIndex, endIndex);

  jsonString = jsonString
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ') 
    .replace(/\n/g, ' ') 
    .replace(/\r/g, '') 
    .replace(/\t/g, ' ') 
    .replace(/\s+/g, ' ') 
    .replace(/,\s*}/g, '}') 
    .replace(/,\s*]/g, ']'); 

  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.warn('First parse attempt failed, trying to fix JSON...');
    console.warn('Error:', parseError.message);
    console.warn('JSON preview:', jsonString.substring(0, 300));
    
    jsonString = jsonString.replace(/([^\\])"([^"]*?)([^\\])$/gm, (match, p1, p2, p3) => {
      if (!match.endsWith('"')) {
        return match + '"';
      }
      return match;
    });
    
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      jsonString += '}'.repeat(openBraces - closeBraces);
    }

    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

    try {
      return JSON.parse(jsonString);
    } catch (secondError) {
      console.error('Failed to parse JSON after fixes:', secondError.message);
      console.error('JSON string (first 800 chars):', jsonString.substring(0, 800));
      console.error('Original response (first 500 chars):', response.substring(0, 500));
      throw new Error(`Failed to parse JSON: ${secondError.message}. Response preview: ${response.substring(0, 200)}`);
    }
  }
};

const analyzeProductByName = async (productName) => {
  try {
    const systemPrompt = `Ти експерт з харчування. Проаналізуй продукт і надай точну інформацію про харчову цінність на 100 грамів продукту у форматі JSON.

ВАЖЛИВО: Відповідай ТІЛЬКИ валідним JSON без додаткового тексту. Переконайся що всі рядки правильно закриті, всі коми на місці, і немає управляючих символів.`;

    const safeProductName = String(productName || '').replace(/"/g, '').replace(/\n/g, ' ').trim();
    
    const userPrompt = `Проаналізуй продукт: ${safeProductName}

Надай інформацію у форматі JSON з такими полями:
- name: точна назва продукту українською
- category: одна з категорій (vegetables, fruits, meat, fish, dairy, grains, legumes, nuts, sweets, beverages, other)
- nutritionPer100g: об'єкт з полями calories (ккал), protein (г), fats (г), carbs (г), fiber (г)
- description: короткий опис продукту та його корисних властивостей

Відповідай ТІЛЬКИ валідним JSON без додаткового тексту.`;

    const response = await callHuggingFaceAPIWithMessages(systemPrompt, userPrompt);
    
    const productData = parseJSONResponse(response);
    return {
      success: true,
      data: productData
    };
  } catch (error) {
    console.error('Hugging Face API Error (analyzeProductByName):', error.message);
    return {
      success: false,
      message: 'Не вдалося розпізнати продукт. Спробуйте інакше сформулювати назву.'
    };
  }
};

const analyzeDailyDiet = async (dailyLog, meals, user) => {
  try {
    const mealsList = meals.map(meal => ({
      type: meal.mealType,
      name: meal.name,
      items: meal.items.map(item => ({
        product: item.product.name,
        amount: item.amount,
        nutrition: item.nutrition
      })),
      total: meal.totalNutrition
    }));

    const systemPrompt = `Ти професійний дієтолог. Проаналізуй денний раціон користувача і надай детальний аналіз у форматі JSON.

ВАЖЛИВО: Відповідай ТІЛЬКИ валідним JSON українською мовою, без додаткового тексту. Переконайся що всі рядки правильно закриті, всі коми на місці, і немає управляючих символів. Екрануй всі спеціальні символи в рядках.`;

    const userPrompt = `

**Інформація про користувача:**
- Вік: ${user.profile.age} років
- Стать: ${user.profile.gender === 'male' ? 'чоловік' : 'жінка'}
- Вага: ${user.profile.weight} кг
- Зріст: ${user.profile.height} см
- Рівень активності: ${user.profile.activityLevel}
- Мета: ${user.profile.goal}

**Денні норми:**
- Калорії: ${dailyLog.dailyNorms.calories} ккал
- Білки: ${dailyLog.dailyNorms.protein} г
- Жири: ${dailyLog.dailyNorms.fats} г
- Вуглеводи: ${dailyLog.dailyNorms.carbs} г

**Спожито за день:**
- Калорії: ${dailyLog.totalNutrition.calories} ккал (${dailyLog.progress.caloriesPercent}%)
- Білки: ${dailyLog.totalNutrition.protein} г (${dailyLog.progress.proteinPercent}%)
- Жири: ${dailyLog.totalNutrition.fats} г (${dailyLog.progress.fatsPercent}%)
- Вуглеводи: ${dailyLog.totalNutrition.carbs} г (${dailyLog.progress.carbsPercent}%)

**Прийоми їжі:**
${JSON.stringify(mealsList, null, 2)}

Надай детальний аналіз у форматі JSON:

{
  "overallAssessment": "загальна оцінка раціону (1-2 речення)",
  "strengths": ["позитивні моменти", "що добре"],
  "weaknesses": ["що потрібно покращити", "недоліки"],
  "macroBalance": {
    "assessment": "оцінка балансу БЖВ",
    "recommendations": ["конкретні рекомендації"]
  },
  "mealTiming": {
    "assessment": "оцінка розподілу їжі протягом дня",
    "recommendations": ["рекомендації по часу прийомів їжі"]
  },
  "missingNutrients": ["які нутрієнти можуть бути в дефіциті"],
  "specificSuggestions": {
    "toAdd": ["конкретні продукти що додати"],
    "toReduce": ["що зменшити або виключити"],
    "alternatives": ["здоровіші альтернативи до поточних продуктів"]
  },
  "motivationalMessage": "мотивуюче повідомлення"
}`;

    const response = await callHuggingFaceAPIWithMessages(systemPrompt, userPrompt);
    const analysis = parseJSONResponse(response);
    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    console.error('Hugging Face API Error (analyzeDailyDiet):', error.message);
    return {
      success: false,
      message: 'Не вдалося проаналізувати раціон. Спробуйте пізніше.'
    };
  }
};

const analyzeWeeklyDiet = async (weeklyLogs, user) => {
  try {
    const weekSummary = weeklyLogs.map(log => ({
      date: log.date.toISOString().split('T')[0],
      consumed: log.totalNutrition,
      norms: log.dailyNorms,
      progress: log.progress
    }));

    const averages = weeklyLogs.reduce((acc, log) => ({
      calories: acc.calories + log.totalNutrition.calories,
      protein: acc.protein + log.totalNutrition.protein,
      fats: acc.fats + log.totalNutrition.fats,
      carbs: acc.carbs + log.totalNutrition.carbs
    }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

    const daysCount = weeklyLogs.length;
    const avgCalories = Math.round(averages.calories / daysCount);
    const avgProtein = Math.round(averages.protein / daysCount);
    const avgFats = Math.round(averages.fats / daysCount);
    const avgCarbs = Math.round(averages.carbs / daysCount);

    const systemPrompt = `Ти професійний дієтолог. Проаналізуй тижневий раціон користувача і надай детальний тижневий аналіз у форматі JSON.

Відповідай ТІЛЬКИ валідним JSON українською мовою, без додаткового тексту.`;

    const userPrompt = `

**Інформація про користувача:**
- Вік: ${user.profile.age} років
- Стать: ${user.profile.gender === 'male' ? 'чоловік' : 'жінка'}
- Вага: ${user.profile.weight} кг
- Зріст: ${user.profile.height} см
- Мета: ${user.profile.goal}

**Денні норми:**
- Калорії: ${user.dailyNorms.calories} ккал
- Білки: ${user.dailyNorms.protein} г
- Жири: ${user.dailyNorms.fats} г
- Вуглеводи: ${user.dailyNorms.carbs} г

**Середнє споживання за ${daysCount} днів:**
- Калорії: ${avgCalories} ккал
- Білки: ${avgProtein} г
- Жири: ${avgFats} г
- Вуглеводи: ${avgCarbs} г

**Детальні дані по днях:**
${JSON.stringify(weekSummary, null, 2)}

Надай детальний тижневий аналіз у форматі JSON:

{
  "weeklyOverview": "загальний огляд тижня (2-3 речення)",
  "consistency": {
    "score": число від 1 до 10,
    "assessment": "оцінка регулярності харчування",
    "daysOnTrack": кількість днів де норми дотримано,
    "daysOffTrack": кількість днів з відхиленнями
  },
  "trends": {
    "calories": "тренд по калоріях (стабільно/зростає/знижується)",
    "protein": "тренд по білках",
    "patterns": ["помічені паттерни в харчуванні"]
  },
  "progressTowardsGoal": {
    "assessment": "наскільки раціон відповідає меті користувача",
    "estimatedProgress": "очікуваний прогрес (наприклад: -0.3 кг на тиждень)"
  },
  "keyIssues": ["основні проблеми що потрібно вирішити"],
  "weeklyRecommendations": {
    "priority": ["пріоритетні зміни на наступний тиждень"],
    "mealPlan": ["загальні рекомендації по плануванню їжі"],
    "lifestyle": ["побутові поради"]
  },
  "achievements": ["що вдалося добре, досягнення"],
  "nextSteps": ["конкретні кроки на наступний тиждень"],
  "motivationalMessage": "мотивуюче повідомлення з врахуванням прогресу"
}`;

    const response = await callHuggingFaceAPIWithMessages(systemPrompt, userPrompt);
    const analysis = parseJSONResponse(response);
    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    console.error('Hugging Face API Error (analyzeWeeklyDiet):', error.message);
    return {
      success: false,
      message: 'Не вдалося проаналізувати тижневий раціон. Спробуйте пізніше.'
    };
  }
};

const getPersonalizedSuggestions = async (user, recentMeals) => {
  try {
    const mealsList = recentMeals.slice(0, 10).map(meal => ({
      date: meal.date.toISOString().split('T')[0],
      type: meal.mealType,
      items: meal.items.map(item => item.product.name)
    }));

    const systemPrompt = `Ти персональний дієтолог. На основі інформації про користувача та його останніх прийомів їжі, запропонуй персоналізовані рекомендації у форматі JSON.

ВАЖЛИВО: Враховуй мету користувача та пропонуй реалістичні рекомендації. Відповідай ТІЛЬКИ валідним JSON українською мовою. Переконайся що всі рядки правильно закриті, всі коми на місці, і немає управляючих символів. Екрануй всі спеціальні символи в рядках.`;

    const userPrompt = `

**Користувач:**
- Вік: ${user.profile.age} років
- Стать: ${user.profile.gender === 'male' ? 'чоловік' : 'жінка'}
- Вага: ${user.profile.weight} кг
- Зріст: ${user.profile.height} см
- Рівень активності: ${user.profile.activityLevel}
- Мета: ${user.profile.goal}

**Останні прийоми їжі:**
${JSON.stringify(mealsList, null, 2)}

Надай персоналізовані рекомендації у форматі JSON:

{
  "recommendedProducts": [
    {
      "name": "назва продукту",
      "category": "категорія",
      "reason": "чому рекомендується",
      "whenToEat": "коли краще вживати"
    }
  ],
  "mealIdeas": [
    {
      "mealType": "breakfast/lunch/dinner/snack",
      "name": "назва страви",
      "ingredients": ["інгредієнти"],
      "benefits": "переваги цієї страви"
    }
  ],
  "hydrationTips": "рекомендації по водному балансу",
  "lifestyleAdvice": ["побутові поради для досягнення мети"]
}`;

    const response = await callHuggingFaceAPIWithMessages(systemPrompt, userPrompt);
    const suggestions = parseJSONResponse(response);
    return {
      success: true,
      data: suggestions
    };
  } catch (error) {
    console.error('Hugging Face API Error (getPersonalizedSuggestions):', error.message);
    return {
      success: false,
      message: 'Не вдалося згенерувати рекомендації. Спробуйте пізніше.'
    };
  }
};

module.exports = {
  analyzeProductByName,
  analyzeDailyDiet,
  analyzeWeeklyDiet,
  getPersonalizedSuggestions
};
