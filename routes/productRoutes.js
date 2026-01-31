const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const {
  createProductValidation,
  updateProductValidation,
  getProductsValidation,
  mongoIdValidation
} = require('../middleware/validators/productValidation');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Отримати список продуктів (публічних та власних)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Пошук по назві продукту (текстовий індекс)
 *         example: "курка"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Фільтр по категорії
 *         example: "М'ясо та птиця"
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
 *         description: Список продуктів з пагінацією
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
 *                   example: 20
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Помилка валідації параметрів
 *       401:
 *         description: Не авторизований
 *   post:
 *     summary: Створити новий продукт
 *     tags: [Products]
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
 *               - category
 *               - nutritionPer100g
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Куряча грудка"
 *               category:
 *                 type: string
 *                 example: "М'ясо та птиця"
 *               nutritionPer100g:
 *                 type: object
 *                 required:
 *                   - calories
 *                   - protein
 *                   - fats
 *                   - carbs
 *                 properties:
 *                   calories:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 900
 *                     example: 165
 *                   protein:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                     example: 31
 *                   fats:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                     example: 3.6
 *                   carbs:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                     example: 0
 *               description:
 *                 type: string
 *                 example: "Філе курячої грудки без шкіри"
 *     responses:
 *       201:
 *         description: Продукт створено
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
 *         description: Помилка валідації
 *       401:
 *         description: Не авторизований
 */
router.route('/')
  .get(protect, getProductsValidation, getProducts)
  .post(protect, createProductValidation, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Отримати продукт за ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId продукту
 *     responses:
 *       200:
 *         description: Дані продукту
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
 *         description: Невірний формат ID
 *       404:
 *         description: Продукт не знайдено
 *       401:
 *         description: Не авторизований
 *   put:
 *     summary: Оновити власний продукт
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId продукту
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               nutritionPer100g:
 *                 type: object
 *                 properties:
 *                   calories:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 900
 *                   protein:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                   fats:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                   carbs:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Продукт оновлено
 *       400:
 *         description: Помилка валідації
 *       403:
 *         description: Не авторизований для редагування цього продукту
 *       404:
 *         description: Продукт не знайдено
 *   delete:
 *     summary: Видалити власний продукт
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId продукту
 *     responses:
 *       200:
 *         description: Продукт видалено
 *       403:
 *         description: Не авторизований для видалення цього продукту
 *       404:
 *         description: Продукт не знайдено
 */
router.route('/:id')
  .get(protect, mongoIdValidation, getProduct)
  .put(protect, updateProductValidation, updateProduct)
  .delete(protect, mongoIdValidation, deleteProduct);

module.exports = router;
