const express = require('express');
const {
  recognizeProduct,
  createProductFromAI,
  analyzeDailyDietAI,
  analyzeWeeklyDietAI,
  getPersonalizedSuggestionsAI
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Застосовуємо AI limiter до всіх роутів (20 запитів/годину)
router.use(aiLimiter);

/**
 * @swagger
 * /api/ai/recognize-product:
 *   post:
 *     summary: Розпізнати продукт за назвою через AI
 *     description: Використовує Hugging Face AI для визначення КБЖУ продукту за назвою. Результат кешується на 24 години. Retry логіка - 3 спроби з exponential backoff.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *             properties:
 *               productName:
 *                 type: string
 *                 minLength: 2
 *                 example: "банан"
 *     responses:
 *       200:
 *         description: Продукт розпізнано успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Банан"
 *                     category:
 *                       type: string
 *                       example: "Фрукти"
 *                     nutritionPer100g:
 *                       type: object
 *                       properties:
 *                         calories:
 *                           type: number
 *                           example: 89
 *                         protein:
 *                           type: number
 *                           example: 1.1
 *                         fats:
 *                           type: number
 *                           example: 0.3
 *                         carbs:
 *                           type: number
 *                           example: 22.8
 *       400:
 *         description: Помилка валідації або AI не зміг розпізнати продукт
 *       401:
 *         description: Не авторизований
 *       429:
 *         description: Ліміт AI запитів вичерпано (20/годину)
 */
router.post('/recognize-product', protect, recognizeProduct);

/**
 * @swagger
 * /api/ai/create-product:
 *   post:
 *     summary: Створити продукт в БД на основі AI розпізнавання
 *     description: Комбінує AI розпізнавання та створення продукту в одному запиті
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *             properties:
 *               productName:
 *                 type: string
 *                 minLength: 2
 *                 example: "яблуко гренні сміт"
 *     responses:
 *       201:
 *         description: Продукт створено на основі AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Помилка валідації або AI не зміг розпізнати
 *       401:
 *         description: Не авторизований
 *       429:
 *         description: Ліміт AI запитів вичерпано
 */
router.post('/create-product', protect, createProductFromAI);

/**
 * @swagger
 * /api/ai/analyze-daily:
 *   get:
 *     summary: Аналіз дієти за день через AI
 *     description: AI аналізує денний раціон та надає персоналізовані рекомендації на основі цілей користувача
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Дата для аналізу (за замовчуванням сьогодні)
 *         example: "2026-01-31"
 *     responses:
 *       200:
 *         description: Аналіз отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       example: "Загалом харчування збалансоване, проте недостатньо білка..."
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Додайте більше білкових продуктів", "Зменшіть вуглеводи ввечері"]
 *                     nutritionAnalysis:
 *                       type: object
 *       400:
 *         description: Немає даних для аналізу
 *       401:
 *         description: Не авторизований
 *       429:
 *         description: Ліміт AI запитів вичерпано
 */
router.get('/analyze-daily', protect, analyzeDailyDietAI);

/**
 * @swagger
 * /api/ai/analyze-weekly:
 *   get:
 *     summary: Аналіз дієти за тиждень через AI
 *     description: AI аналізує тижневі тренди харчування та надає комплексні рекомендації
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Тижневий аналіз отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     weekSummary:
 *                       type: string
 *                       example: "Протягом тижня ви дотримувались норм калорій 5 з 7 днів..."
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Надлишок вуглеводів у вихідні", "Недостатнє споживання білка"]
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Недостатньо даних (потрібен хоча б 1 день)
 *       401:
 *         description: Не авторизований
 *       429:
 *         description: Ліміт AI запитів вичерпано
 */
router.get('/analyze-weekly', protect, analyzeWeeklyDietAI);

/**
 * @swagger
 * /api/ai/suggestions:
 *   get:
 *     summary: Персоналізовані рекомендації від AI
 *     description: AI генерує рекомендації продуктів та прийомів їжі на основі профілю та історії користувача
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Рекомендації отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Спробуйте додати лосось для омега-3", "Замініть білий рис на бурий"]
 *                     mealIdeas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *       401:
 *         description: Не авторизований
 *       429:
 *         description: Ліміт AI запитів вичерпано
 */
router.get('/suggestions', protect, getPersonalizedSuggestionsAI);

module.exports = router;
