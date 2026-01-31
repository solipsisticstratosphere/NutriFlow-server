const huggingFaceService = require('./huggingFaceService');
const { getCachedResponse, setCachedResponse } = require('./aiCache');

/**
 * Retry з exponential backoff
 * @param {Function} fn - Функція для повтору
 * @param {number} maxRetries - Максимальна кількість спроб
 * @param {number} delay - Початкова затримка в мс
 * @returns {Promise} Результат або помилка
 */
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

/**
 * Викликає Hugging Face AI service з retry та timeout
 * @param {string} method - Назва методу (analyzeProductByName, etc.)
 * @param {Array} args - Аргументи для методу
 * @param {number} timeout - Таймаут в мс
 * @returns {Promise} AI відповідь
 */
const callAIWithRetry = async (method, args, timeout = 30000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI request timeout')), timeout)
  );

  try {
    console.log(`🤖 Calling Hugging Face for ${method}...`);
    const result = await Promise.race([
      retryWithBackoff(async () => {
        const response = await huggingFaceService[method](...args);
        if (!response.success) {
          throw new Error(response.message || 'AI request failed');
        }
        return response;
      }),
      timeoutPromise
    ]);

    console.log(`✓ Hugging Face успішно відповів для ${method}`);
    return result;
  } catch (error) {
    console.error(`❌ Hugging Face failed for ${method}:`, error.message);
    throw new Error('Не вдалося отримати відповідь від AI сервісу. Спробуйте пізніше.');
  }
};

/**
 * Розпізнає продукт за назвою (з кешуванням)
 * @param {string} productName - Назва продукту
 * @returns {Promise} AI відповідь з інформацією про продукт
 */
const analyzeProductByName = async (productName) => {
  const cacheKey = { name: productName.toLowerCase().trim() };


  const cached = getCachedResponse('product', cacheKey);
  if (cached) {
    return cached;
  }

  
  const result = await callAIWithRetry('analyzeProductByName', [productName], 30000);

  
  if (result.success) {
    setCachedResponse('product', cacheKey, result);
  }

  return result;
};

/**
 * Аналізує денний раціон (без кешу - кожен день унікальний)
 * @param {object} dailyLog - Денний лог
 * @param {array} meals - Прийоми їжі
 * @param {object} user - Користувач
 * @returns {Promise} AI аналіз
 */
const analyzeDailyDiet = async (dailyLog, meals, user) => {
  return await callAIWithRetry('analyzeDailyDiet', [dailyLog, meals, user], 45000);
};

/**
 * Аналізує тижневий раціон (без кешу)
 * @param {array} weeklyLogs - Тижневі логи
 * @param {object} user - Користувач
 * @returns {Promise} AI аналіз
 */
const analyzeWeeklyDiet = async (weeklyLogs, user) => {
  return await callAIWithRetry('analyzeWeeklyDiet', [weeklyLogs, user], 60000);
};

/**
 * Генерує персоналізовані рекомендації (з кешуванням на основі останніх 5 прийомів)
 * @param {object} user - Користувач
 * @param {array} recentMeals - Останні прийоми їжі
 * @returns {Promise} AI рекомендації
 */
const getPersonalizedSuggestions = async (user, recentMeals) => {
  
  const cacheKey = {
    goal: user.profile?.goal,
    mealIds: recentMeals.slice(0, 5).map(m => m._id.toString())
  };

  
  const cached = getCachedResponse('suggestions', cacheKey);
  if (cached) {
    return cached;
  }

  
  const result = await callAIWithRetry('getPersonalizedSuggestions', [user, recentMeals], 45000);

  
  if (result.success) {
    setCachedResponse('suggestions', cacheKey, result);
  }

  return result;
};

module.exports = {
  analyzeProductByName,
  analyzeDailyDiet,
  analyzeWeeklyDiet,
  getPersonalizedSuggestions
};
