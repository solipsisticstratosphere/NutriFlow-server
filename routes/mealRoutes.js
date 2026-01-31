const express = require('express');
const {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal
} = require('../controllers/mealController');
const { protect } = require('../middleware/auth');
const {
  createMealValidation,
  updateMealValidation,
  getMealsValidation,
  mongoIdValidation
} = require('../middleware/validators/mealValidation');

const router = express.Router();

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Отримати список прийомів їжі
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Початкова дата (YYYY-MM-DD)
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Кінцева дата (YYYY-MM-DD)
 *         example: "2026-01-31"
 *       - in: query
 *         name: mealType
 *         schema:
 *           type: string
 *           enum: [breakfast, lunch, dinner, snack]
 *         description: Тип прийому їжі
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер сторінки
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Кількість елементів на сторінку
 *     responses:
 *       200:
 *         description: Список прийомів їжі з пагінацією
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 15
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meal'
 *       400:
 *         description: Помилка валідації параметрів
 *       401:
 *         description: Не авторизований
 *   post:
 *     summary: Створити прийом їжі
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mealType
 *               - items
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Сніданок"
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *                 example: "breakfast"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-31T08:00:00.000Z"
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - amount
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: ID продукту
 *                       example: "507f1f77bcf86cd799439011"
 *                     amount:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 10000
 *                       description: Кількість в грамах
 *                       example: 150
 *               notes:
 *                 type: string
 *                 example: "Смачний сніданок"
 *     responses:
 *       201:
 *         description: Прийом їжі створено, DailyLog оновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Meal'
 *       400:
 *         description: Помилка валідації або продукти не знайдено
 *       401:
 *         description: Не авторизований
 */
router.route('/')
  .get(protect, getMealsValidation, getMeals)
  .post(protect, createMealValidation, createMeal);

/**
 * @swagger
 * /api/meals/{id}:
 *   get:
 *     summary: Отримати прийом їжі за ID
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId прийому їжі
 *     responses:
 *       200:
 *         description: Дані прийому їжі
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Meal'
 *       400:
 *         description: Невірний формат ID
 *       403:
 *         description: Доступ заборонено (чужий прийом їжі)
 *       404:
 *         description: Прийом їжі не знайдено
 *   put:
 *     summary: Оновити прийом їжі
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId прийому їжі
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               date:
 *                 type: string
 *                 format: date-time
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 10000
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Прийом їжі оновлено, DailyLog перераховано
 *       400:
 *         description: Помилка валідації
 *       403:
 *         description: Доступ заборонено
 *       404:
 *         description: Прийом їжі не знайдено
 *   delete:
 *     summary: Видалити прийом їжі
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId прийому їжі
 *     responses:
 *       200:
 *         description: Прийом їжі видалено, DailyLog оновлено
 *       403:
 *         description: Доступ заборонено
 *       404:
 *         description: Прийом їжі не знайдено
 */
router.route('/:id')
  .get(protect, mongoIdValidation, getMeal)
  .put(protect, updateMealValidation, updateMeal)
  .delete(protect, mongoIdValidation, deleteMeal);

module.exports = router;
