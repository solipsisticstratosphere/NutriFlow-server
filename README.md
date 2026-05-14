# NutriFlow Server

Backend API для додатку відстеження харчування з AI аналізом дієти.

## Зміст

- [Функціонал](#функціонал)
- [Технології](#технології)
- [Встановлення](#встановлення)
- [Деплой на Render](#деплой-на-render)
- [API](#api)
- [Тестування](#тестування)
- [Скрипти](#скрипти)
- [Структура проекту](#структура-проекту)

## Функціонал

- **Авторизація JWT** — реєстрація, логін, захищені endpoints
- **Управління продуктами** — CRUD, публічні/приватні продукти, пошук
- **Прийоми їжі** — створення з автоматичним розрахунком КБЖУ
- **Аналітика** — денна, тижнева, місячна статистика + графіки
- **Відстеження води та ваги** — 0–10 000 мл/день, журнал ваги
- **AI (Groq Llama 3.1 8B)** — розпізнавання продуктів, аналіз раціону, рекомендації
- **Кешування AI** — 24 год TTL, ~98% прискорення повторних запитів
- **Rate limiting** — 3-рівнева система (general / auth / AI)
- **Swagger UI** — повна документація на `/api-docs`

## Технології

| Компонент | Технологія |
|---|---|
| Runtime | Node.js 22+ |
| Framework | Express 4 |
| База даних | MongoDB Atlas + Mongoose |
| Авторизація | JWT + bcryptjs |
| AI | Groq API (Llama 3.1 8B Instant) |
| Кеш | node-cache |
| Валідація | express-validator |
| Rate limiting | express-rate-limit |
| Документація | swagger-jsdoc + swagger-ui-express |

## Встановлення

### 1. Клонувати репозиторій
```bash
git clone <repository-url>
cd NutriFlow-server
```

### 2. Встановити залежності
```bash
npm install
```

### 3. Налаштувати .env

Скопіюйте `.env.example` у `.env` та заповніть значення:

```env
PORT=5000
NODE_ENV=development

# Основна БД
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nutriflow?retryWrites=true&w=majority

# Тестова БД (окрема база, щоб тести не торкались основних даних)
TEST_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nutriflow-test?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# AI
GROQ_API_KEY=gsk_your_groq_api_key_here
```

> **Groq API Key** — безкоштовна реєстрація на [console.groq.com](https://console.groq.com)

### 4. Заповнити тестову БД
```bash
npm run db:reset
```

### 5. Запустити сервер
```bash
npm start          # продакшн
npm run dev        # розробка з auto-reload
```

Сервер: `http://localhost:5000`  
Swagger: `http://localhost:5000/api-docs`

## Деплой на Render

Проект містить `render.yaml` для автоматичного конфігурування.

### Кроки

1. Залийте код на GitHub
2. Зайдіть на [render.com](https://render.com) → **New → Web Service**
3. Підключіть репозиторій — Render підхопить `render.yaml` автоматично
4. В **Environment** додайте змінні:

| Змінна | Значення |
|---|---|
| `MONGODB_URI` | URI вашої Atlas БД (`nutriflow`) |
| `JWT_SECRET` | випадковий рядок (мін. 32 символи) |
| `GROQ_API_KEY` | ключ з console.groq.com |

> `TEST_MONGODB_URI` — тільки для локальної розробки, на Render не потрібна.

Після деплою:
- API: `https://your-service.onrender.com`
- Docs: `https://your-service.onrender.com/api-docs`

> На безкоштовному плані сервіс засинає після 15 хв неактивності — перший запрос займе ~30 сек.

## API

Base URL: `http://localhost:5000/api`

### Авторизація
| Метод | Endpoint | Опис |
|---|---|---|
| POST | `/auth/register` | Реєстрація |
| POST | `/auth/login` | Логін |
| GET | `/auth/me` | Поточний профіль |
| PUT | `/auth/profile` | Оновити профіль |

### Продукти
| Метод | Endpoint | Опис |
|---|---|---|
| GET | `/products` | Список (пагінація, пошук, фільтр) |
| GET | `/products/:id` | Деталі |
| POST | `/products` | Створити |
| PUT | `/products/:id` | Оновити |
| DELETE | `/products/:id` | Видалити |

### Прийоми їжі
| Метод | Endpoint | Опис |
|---|---|---|
| GET | `/meals` | Список (фільтр за датою, типом) |
| GET | `/meals/:id` | Деталі |
| POST | `/meals` | Створити |
| PUT | `/meals/:id` | Оновити |
| DELETE | `/meals/:id` | Видалити |

### Аналітика
| Метод | Endpoint | Опис |
|---|---|---|
| GET | `/analytics/daily` | Денний лог |
| GET | `/analytics/weekly` | Тижнева статистика |
| GET | `/analytics/monthly` | Місячна статистика |
| GET | `/analytics/chart` | Дані для графіку |
| GET | `/analytics/meals-category` | Статистика за типами прийомів |
| PUT | `/analytics/daily` | Оновити воду / вагу / нотатки |

### AI
| Метод | Endpoint | Опис | Ліміт |
|---|---|---|---|
| POST | `/ai/recognize-product` | Розпізнати продукт → КБЖУ | 20/год |
| POST | `/ai/create-product` | Розпізнати та зберегти в БД | 20/год |
| GET | `/ai/analyze-daily` | AI аналіз денного раціону | 20/год |
| GET | `/ai/analyze-weekly` | AI аналіз тижневого раціону | 20/год |
| GET | `/ai/suggestions` | Персоналізовані рекомендації | 20/год |

### Приклади запитів

**Реєстрація:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Іван Петренко",
  "email": "ivan@example.com",
  "password": "Password123",
  "profile": {
    "age": 30,
    "gender": "male",
    "weight": 80,
    "height": 180,
    "activityLevel": "moderate",
    "goal": "lose_weight"
  }
}
```

**Розпізнавання продукту через AI:**
```bash
POST /api/ai/recognize-product
Authorization: Bearer <token>
Content-Type: application/json

{ "productName": "банан" }
```

**Оновлення води:**
```bash
PUT /api/analytics/daily
Authorization: Bearer <token>
Content-Type: application/json

{ "waterIntake": 2200, "weight": 79.5, "notes": "Відчував себе добре" }
```

## Тестування

Детальна документація: [tests/README.md](tests/README.md)

### Важливо: тести використовують окрему БД

`db:reset`, `db:seed`, `db:clear` та workflow-тест завжди підключаються до `TEST_MONGODB_URI` (`nutriflow-test`), **не торкаючись основної бази**. Якщо `TEST_MONGODB_URI` не задано — скрипт завершиться з помилкою.

### Запуск тестів

```bash
# Скинути тестову БД та запустити
npm run db:reset
npm run test:all

# Окремі тести (сервер на порту 5000)
npm run test:api           # API + rate limiting
npm run test:water         # Відстеження води
npm run test:validation    # Валідація вхідних даних
npm run test:cache         # AI кешування
npm run test:ai            # AI розпізнавання продуктів
npm run test:ai-suggestions  # AI рекомендації

# Full workflow тест (потребує тестового сервера)
npm run test:server        # термінал 1: сервер на порту 5001 + nutriflow-test
npm run test:workflow      # термінал 2: повний E2E тест
```

### Результати

| Тест | Успішність |
|---|---|
| test-api.js | 100% (35/35) |
| test-water-tracking.js | 100% |
| test-validation-direct.js | 100% |
| test-cache.js | 100% |
| test-ai.js | 100% |
| test-ai-suggestions.js | 100% |
| full-test.js | 100% (35/35) |

## Скрипти

```bash
# Сервер
npm start                  # запустити
npm run dev                # запустити з nodemon

# База даних (завжди TEST_MONGODB_URI)
npm run db:clear           # очистити тестову БД
npm run db:seed            # заповнити тестовими даними
npm run db:reset           # очистити + заповнити

# Тестування
npm run test:server        # тестовий сервер (порт 5001, nutriflow-test)
npm run test:all           # api + water + validation + cache
npm run test:api           # API endpoints
npm run test:water         # відстеження води
npm run test:validation    # валідація
npm run test:cache         # AI кешування
npm run test:ai            # AI продукти
npm run test:ai-suggestions  # AI рекомендації
npm run test:full          # повний workflow (порт 5000)
npm run test:workflow      # повний E2E (порт 5001)
```

## Тестові облікові записи

Після `npm run db:reset`:

| Email | Пароль | Профіль |
|---|---|---|
| olena@example.com | Test123 | Жінка, 28 р., мета: схуднути |
| andriy@example.com | Test123 | Чоловік, 32 р., мета: набрати м'язи |
| maria@example.com | Test123 | Жінка, 25 р., мета: підтримка ваги |

## Структура проекту

```
NutriFlow-server/
├── config/
│   ├── db.js                    # MongoDB підключення
│   ├── indexes.js               # Індекси БД
│   └── swagger.js               # Swagger конфігурація
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── mealController.js
│   ├── analyticsController.js
│   └── aiController.js
├── middleware/
│   ├── auth.js                  # JWT авторизація
│   ├── errorHandler.js
│   ├── rateLimiter.js           # general / auth / AI ліміти
│   └── validators/
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Meal.js
│   └── DailyLog.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── mealRoutes.js
│   ├── analyticsRoutes.js
│   └── aiRoutes.js
├── scripts/
│   ├── clear-db.js              # очищення тестової БД
│   ├── seed.js                  # заповнення тестовими даними
│   ├── full-workflow-test.js    # E2E тест
│   └── start-test-server.js    # сервер для workflow-тесту
├── services/
│   ├── aiService.js             # retry + кешування
│   ├── huggingFaceService.js    # Groq API клієнт
│   ├── aiCache.js               # node-cache обгортка
│   ├── calculationService.js    # BMR / TDEE / макроси
│   └── recommendationService.js
├── tests/
│   ├── README.md
│   ├── test-api.js
│   ├── test-ai.js
│   ├── test-ai-suggestions.js
│   ├── test-cache.js
│   ├── test-water-tracking.js
│   ├── test-validation-direct.js
│   └── full-test.js
├── utils/
│   └── pagination.js
├── .env                         # не комітити
├── .env.example                 # шаблон змінних
├── render.yaml                  # конфіг для Render
├── server.js
└── package.json
```
