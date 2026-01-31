const express = require('express');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation
} = require('../middleware/validators/authValidation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Іван Петренко"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ivan@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
 *                 example: "Password123"
 *               profile:
 *                 type: object
 *                 properties:
 *                   age:
 *                     type: integer
 *                     minimum: 13
 *                     maximum: 120
 *                     example: 30
 *                   gender:
 *                     type: string
 *                     enum: [male, female, other]
 *                     example: "male"
 *                   weight:
 *                     type: number
 *                     minimum: 20
 *                     maximum: 500
 *                     example: 75
 *                   height:
 *                     type: integer
 *                     minimum: 50
 *                     maximum: 300
 *                     example: 180
 *                   activityLevel:
 *                     type: string
 *                     enum: [sedentary, light, moderate, active, very_active]
 *                     example: "moderate"
 *                   goal:
 *                     type: string
 *                     enum: [lose_weight, maintain, gain_weight, gain_muscle]
 *                     example: "maintain"
 *     responses:
 *       201:
 *         description: Користувач успішно створений
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
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     dailyNorms:
 *                       type: object
 *       400:
 *         description: Помилка валідації або користувач вже існує
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Забагато спроб реєстрації
 */
router.post('/register', authLimiter, registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизація користувача
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ivan@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Успішна авторизація
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
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Невірні дані для входу
 *       429:
 *         description: Забагато спроб авторизації
 */
router.post('/login', authLimiter, loginValidation, login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Отримати дані поточного користувача
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Дані користувача
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизований
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Оновити профіль користувача
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Іван Іванович"
 *               profile:
 *                 type: object
 *                 properties:
 *                   age:
 *                     type: integer
 *                     example: 31
 *                   weight:
 *                     type: number
 *                     example: 76
 *                   height:
 *                     type: integer
 *                     example: 181
 *                   activityLevel:
 *                     type: string
 *                     enum: [sedentary, light, moderate, active, very_active]
 *                   goal:
 *                     type: string
 *                     enum: [lose_weight, maintain, gain_weight, gain_muscle]
 *     responses:
 *       200:
 *         description: Профіль оновлено, денні норми перераховані
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Помилка валідації
 *       401:
 *         description: Не авторизований
 */
router.put('/profile', protect, updateProfileValidation, updateProfile);

module.exports = router;
