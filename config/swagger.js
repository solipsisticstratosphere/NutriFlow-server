const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NutriFlow API',
      version: '1.0.0',
      description: 'API для відстеження харчування з AI аналізом дієти та персоналізованими рекомендаціями',
      contact: {
        name: 'NutriFlow Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: '{protocol}://{host}:{port}',
        description: 'Custom server',
        variables: {
          protocol: {
            default: 'http',
            enum: ['http', 'https']
          },
          host: {
            default: 'localhost'
          },
          port: {
            default: '5000'
          }
        }
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен отриманий після авторизації'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Помилка сервера'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Іван Петренко'
            },
            email: {
              type: 'string',
              example: 'ivan@example.com'
            },
            profile: {
              type: 'object',
              properties: {
                age: { type: 'number', example: 30 },
                gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
                weight: { type: 'number', example: 75 },
                height: { type: 'number', example: 180 },
                activityLevel: {
                  type: 'string',
                  enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
                  example: 'moderate'
                },
                goal: {
                  type: 'string',
                  enum: ['lose_weight', 'maintain', 'gain_weight', 'gain_muscle'],
                  example: 'maintain'
                }
              }
            },
            dailyNorms: {
              type: 'object',
              properties: {
                calories: { type: 'number', example: 2400 },
                protein: { type: 'number', example: 120 },
                fats: { type: 'number', example: 80 },
                carbs: { type: 'number', example: 300 }
              }
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Куряча грудка'
            },
            category: {
              type: 'string',
              example: "М'ясо та птиця"
            },
            nutritionPer100g: {
              type: 'object',
              properties: {
                calories: { type: 'number', example: 165 },
                protein: { type: 'number', example: 31 },
                fats: { type: 'number', example: 3.6 },
                carbs: { type: 'number', example: 0 }
              }
            },
            userId: {
              type: 'string',
              nullable: true,
              example: '507f1f77bcf86cd799439011'
            },
            isPublic: {
              type: 'boolean',
              example: true
            }
          }
        },
        Meal: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Сніданок'
            },
            mealType: {
              type: 'string',
              enum: ['breakfast', 'lunch', 'dinner', 'snack'],
              example: 'breakfast'
            },
            date: {
              type: 'string',
              format: 'date-time',
              example: '2026-01-31T08:00:00.000Z'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: {
                    type: 'string',
                    example: '507f1f77bcf86cd799439011'
                  },
                  amount: {
                    type: 'number',
                    example: 150
                  },
                  nutrition: {
                    type: 'object',
                    properties: {
                      calories: { type: 'number', example: 248 },
                      protein: { type: 'number', example: 46.5 },
                      fats: { type: 'number', example: 5.4 },
                      carbs: { type: 'number', example: 0 }
                    }
                  }
                }
              }
            },
            totalNutrition: {
              type: 'object',
              properties: {
                calories: { type: 'number', example: 450 },
                protein: { type: 'number', example: 50 },
                fats: { type: 'number', example: 15 },
                carbs: { type: 'number', example: 35 }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 5 },
            totalItems: { type: 'number', example: 98 },
            itemsPerPage: { type: 'number', example: 20 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

module.exports = swaggerJsdoc(options);
