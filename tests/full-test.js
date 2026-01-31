const http = require('http');

let authToken = '';
let testProductId = '';
let testMealId = '';

const request = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function runFullTests() {
  console.log('\n🧪 ===== NUTRIFLOW API COMPREHENSIVE TESTS =====\n');

  let passed = 0, failed = 0;

  const test = (name, condition) => {
    if (condition) {
      console.log(`   ✅ ${name}`);
      passed++;
    } else {
      console.log(`   ❌ ${name}`);
      failed++;
    }
  };

  try {
    // 1. ROOT & SWAGGER
    console.log('📍 1. ROOT & SWAGGER TESTS');
    const root = await request('GET', '/');
    test('Root endpoint returns 200', root.status === 200);
    test('Root has documentation link', root.data.documentation === '/api-docs');
    test('Root has all endpoints', root.data.endpoints.auth && root.data.endpoints.products);
    console.log();

    // 2. VALIDATION TESTS
    console.log('🔍 2. VALIDATION TESTS');
    const invalidReg = await request('POST', '/api/auth/register', { email: 'invalid' });
    test('Rejects invalid registration (400)', invalidReg.status === 400);
    test('Returns validation error', invalidReg.data.success === false);

    const weakPassword = await request('POST', '/api/auth/register', {
      name: 'Test', email: 'test@test.com', password: '123'
    });
    test('Rejects weak password', weakPassword.status === 400);
    console.log();

    // 3. AUTH TESTS
    console.log('🔐 3. AUTHENTICATION TESTS');
    const timestamp = Date.now();
    const regData = {
      name: 'Full Test User',
      email: `fulltest${timestamp}@example.com`,
      password: 'Test123',
      profile: {
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
        activityLevel: 'moderate',
        goal: 'maintain'
      }
    };

    const register = await request('POST', '/api/auth/register', regData);
    test('User registration successful (201)', register.status === 201);
    test('Registration returns token', !!register.data.data?.token);
    test('Registration calculates daily norms', !!register.data.data?.dailyNorms);

    authToken = register.data.data?.token || '';

    const login = await request('POST', '/api/auth/login', {
      email: regData.email,
      password: regData.password
    });
    test('User login successful (200)', login.status === 200);
    test('Login returns token', !!login.data.data?.token);

    const me = await request('GET', '/api/auth/me', null, authToken);
    test('Protected route works with token', me.status === 200);
    test('Returns user data', me.data.data.name === regData.name);

    const noAuth = await request('GET', '/api/auth/me');
    test('Protected route blocks without token (401)', noAuth.status === 401);
    console.log();

    // 4. PRODUCTS TESTS
    console.log('🍎 4. PRODUCTS TESTS');
    const invalidProduct = await request('POST', '/api/products', {
      name: 'Test',
      category: 'INVALID'
    }, authToken);
    test('Validates product category', invalidProduct.status === 400);

    const createProduct = await request('POST', '/api/products', {
      name: 'Test Banana',
      category: 'fruits',
      nutritionPer100g: {
        calories: 89,
        protein: 1.1,
        fats: 0.3,
        carbs: 22.8
      }
    }, authToken);
    test('Product creation successful (201)', createProduct.status === 201);
    test('Product has correct nutrition', createProduct.data.data?.nutritionPer100g.calories === 89);
    testProductId = createProduct.data.data?._id;

    const getProducts = await request('GET', '/api/products?page=1&limit=10', null, authToken);
    test('Get products with pagination', getProducts.status === 200);
    test('Returns pagination metadata', !!getProducts.data.pagination);
    test('Pagination has correct structure',
      getProducts.data.pagination.currentPage === 1 &&
      typeof getProducts.data.pagination.totalPages === 'number'
    );

    const searchProducts = await request('GET', '/api/products?search=banana', null, authToken);
    test('Product search works', searchProducts.status === 200);

    if (testProductId) {
      const updateProduct = await request('PUT', `/api/products/${testProductId}`, {
        name: 'Updated Banana'
      }, authToken);
      test('Product update successful', updateProduct.status === 200);
    }
    console.log();

    // 5. MEALS TESTS
    console.log('🍽️  5. MEALS TESTS');
    const invalidMeal = await request('POST', '/api/meals', {
      name: 'Test',
      mealType: 'invalid'
    }, authToken);
    test('Validates meal type', invalidMeal.status === 400);

    if (testProductId) {
      const createMeal = await request('POST', '/api/meals', {
        name: 'Test Breakfast',
        mealType: 'breakfast',
        items: [
          { product: testProductId, amount: 150 }
        ]
      }, authToken);
      test('Meal creation successful (201)', createMeal.status === 201);
      test('Meal has total nutrition calculated', !!createMeal.data.data?.totalNutrition);
      test('Nutrition correctly scaled (150g)',
        createMeal.data.data?.totalNutrition.calories > 100
      );
      testMealId = createMeal.data.data?._id;

      const getMeals = await request('GET', '/api/meals?page=1&limit=10', null, authToken);
      test('Get meals with pagination', getMeals.status === 200);

      const startDate = new Date().toISOString().split('T')[0];
      const getMealsByDate = await request('GET',
        `/api/meals?startDate=${startDate}&endDate=${startDate}`,
        null, authToken
      );
      test('Filter meals by date range', getMealsByDate.status === 200);
    }
    console.log();

    // 6. RATE LIMITING TEST
    console.log('⏱️  6. RATE LIMITING TEST');
    const rateLimitRequests = [];
    for (let i = 0; i < 110; i++) {
      rateLimitRequests.push(request('GET', '/', null, authToken));
    }
    const results = await Promise.all(rateLimitRequests);
    const blocked = results.filter(r => r.status === 429).length;
    test('Rate limiter blocks after 100 requests', blocked > 0);
    console.log(`   (Made 110 requests, ${blocked} blocked)`);
    console.log();

    // 7. ERROR HANDLING TEST
    console.log('❌ 7. ERROR HANDLING TESTS');
    const invalidId = await request('GET', '/api/products/invalid-id', null, authToken);
    test('Returns 400 for invalid MongoDB ID', invalidId.status === 400);

    const notFound = await request('GET', '/api/products/507f1f77bcf86cd799439011', null, authToken);
    test('Returns 404 for not found resource', notFound.status === 404);

    const invalidToken = await request('GET', '/api/auth/me', null, 'invalid-token');
    test('Returns 401 for invalid token', invalidToken.status === 401);
    console.log();

    // 8. DATABASE OPTIMIZATION TEST
    console.log('⚡ 8. PERFORMANCE & OPTIMIZATION');
    const startTime = Date.now();
    await request('GET', '/api/products?page=1&limit=20', null, authToken);
    const endTime = Date.now();
    test('Products query with pagination < 500ms', (endTime - startTime) < 500);
    console.log(`   (Query time: ${endTime - startTime}ms)`);
    console.log();

    // CLEANUP
    console.log('🧹 CLEANUP');
    if (testMealId) {
      const deleteMeal = await request('DELETE', `/api/meals/${testMealId}`, null, authToken);
      test('Meal deletion successful', deleteMeal.status === 200);
    }
    if (testProductId) {
      const deleteProduct = await request('DELETE', `/api/products/${testProductId}`, null, authToken);
      test('Product deletion successful', deleteProduct.status === 200);
    }

    // RESULTS
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!\n');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed\n`);
    }

    process.exit(failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed (+ 1 crash)\n`);
    process.exit(1);
  }
}

runFullTests();
