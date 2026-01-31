const express = require('express');
const {
  getDailyLog,
  getWeeklyStats,
  getMonthlyStats,
  getProgressChart,
  updateDailyLog,
  getMealsByCategory
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const {
  updateDailyLogValidation,
  getDailyLogValidation,
  getWeeklyStatsValidation,
  getMonthlyStatsValidation,
  getProgressChartValidation,
  getMealsByCategoryValidation
} = require('../middleware/validators/analyticsValidation');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/daily:
 *   get:
 *     summary: Отримати денний лог харчування
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Дата в форматі ISO (за замовчуванням - сьогодні)
 *     responses:
 *       200:
 *         description: Денний лог з рекомендаціями
 *       401:
 *         description: Не авторизовано
 */
router.get('/daily', protect, getDailyLogValidation, getDailyLog);

/**
 * @swagger
 * /api/analytics/weekly:
 *   get:
 *     summary: Отримати тижневу статистику
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Кінцева дата періоду (за замовчуванням - сьогодні)
 *     responses:
 *       200:
 *         description: Тижнева статистика
 *       401:
 *         description: Не авторизовано
 */
router.get('/weekly', protect, getWeeklyStatsValidation, getWeeklyStats);

/**
 * @swagger
 * /api/analytics/monthly:
 *   get:
 *     summary: Отримати місячну статистику
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Рік (за замовчуванням - поточний)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 11
 *         description: Місяць (0-11, за замовчуванням - поточний)
 *     responses:
 *       200:
 *         description: Місячна статистика
 *       401:
 *         description: Не авторизовано
 */
router.get('/monthly', protect, getMonthlyStatsValidation, getMonthlyStats);

/**
 * @swagger
 * /api/analytics/chart:
 *   get:
 *     summary: Отримати дані для графіку прогресу
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Кількість днів для відображення
 *     responses:
 *       200:
 *         description: Дані для графіку
 *       401:
 *         description: Не авторизовано
 */
router.get('/chart', protect, getProgressChartValidation, getProgressChart);

/**
 * @swagger
 * /api/analytics/meals-category:
 *   get:
 *     summary: Отримати статистику прийомів їжі за категоріями
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Кількість днів для аналізу
 *     responses:
 *       200:
 *         description: Статистика по типах прийомів їжі
 *       401:
 *         description: Не авторизовано
 */
router.get('/meals-category', protect, getMealsByCategoryValidation, getMealsByCategory);

/**
 * @swagger
 * /api/analytics/daily:
 *   put:
 *     summary: Оновити денний лог (вода, вага, нотатки)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Дата (за замовчуванням - сьогодні)
 *               waterIntake:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10000
 *                 description: Споживання води в мл (0-10000)
 *                 example: 2000
 *               weight:
 *                 type: number
 *                 minimum: 20
 *                 maximum: 500
 *                 description: Вага в кг (20-500)
 *                 example: 70.5
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Нотатки до дня
 *                 example: "Добре почувався, багато енергії"
 *           examples:
 *             waterOnly:
 *               summary: Тільки вода
 *               value:
 *                 waterIntake: 2500
 *             waterAndWeight:
 *               summary: Вода та вага
 *               value:
 *                 waterIntake: 1800
 *                 weight: 72.3
 *             full:
 *               summary: Повний запис
 *               value:
 *                 date: "2026-01-31"
 *                 waterIntake: 2200
 *                 weight: 68.5
 *                 notes: "Тренування вранці"
 *     responses:
 *       200:
 *         description: Денний лог оновлено
 *       400:
 *         description: Помилка валідації
 *       401:
 *         description: Не авторизовано
 */
router.put('/daily', protect, updateDailyLogValidation, updateDailyLog);

module.exports = router;
