const http = require('http');

const API_PORT = Number(process.env.TEST_API_PORT || process.env.PORT || 5000);

const makeRequest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000);
    req.on('timeout', () => reject(new Error('Timeout')));

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function testAISuggestions() {
  console.log('🤖 Testing AI Recommendations\n');

  try {
    // 1. Login
    console.log('1️⃣  Logging in as Olena...');
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'olena@example.com',
      password: 'Test123'
    });

    if (!login.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = login.data.data.token;
    const user = login.data.data;
    console.log(`   ✅ Logged in as ${user.name}\n`);

    // 2. Get meals
    console.log('2️⃣  Checking existing meals...');
    const mealsResponse = await makeRequest('GET', '/api/meals?limit=100', null, token);

    if (mealsResponse.data.success) {
      const meals = mealsResponse.data.data;
      console.log(`   ✅ Found ${meals.length} meals\n`);

      meals.forEach((meal, i) => {
        console.log(`   Meal ${i + 1}: ${meal.name} (${meal.mealType})`);
        console.log(`   - ${Math.round(meal.totalNutrition.calories)} kcal`);
      });
      console.log('');
    }

    // 3. Get AI Recommendations
    console.log('3️⃣  Requesting AI recommendations...');
    console.log('   (This may take 5-30 seconds...)\n');

    const startTime = Date.now();
    const suggestions = await makeRequest('GET', '/api/ai/suggestions', null, token);
    const duration = Date.now() - startTime;

    console.log(`   ⏱️  Response time: ${duration}ms\n`);

    if (suggestions.data.success) {
      const data = suggestions.data.data;

      console.log('✅ AI RECOMMENDATIONS:\n');
      console.log('═'.repeat(60));

      // Recommended Products
      if (data.recommendedProducts && data.recommendedProducts.length > 0) {
        console.log('\n📋 РЕКОМЕНДОВАНІ ПРОДУКТИ:\n');
        data.recommendedProducts.forEach((product, i) => {
          console.log(`${i + 1}. ${product.name} (${product.category})`);
          console.log(`   Причина: ${product.reason}`);
          console.log(`   Коли: ${product.whenToEat}\n`);
        });
      }

      // Meal Ideas
      if (data.mealIdeas && data.mealIdeas.length > 0) {
        console.log('🍽️  ІДЕЇ СТРАВ:\n');
        data.mealIdeas.forEach((idea, i) => {
          console.log(`${i + 1}. ${idea.name} (${idea.mealType})`);
          if (idea.ingredients) {
            console.log(`   Інгредієнти: ${idea.ingredients.join(', ')}`);
          }
          console.log(`   Переваги: ${idea.benefits}\n`);
        });
      }

      // Hydration Tips
      if (data.hydrationTips) {
        console.log('💧 ВОДНИЙ БАЛАНС:');
        console.log(`   ${data.hydrationTips}\n`);
      }

      // Lifestyle Advice
      if (data.lifestyleAdvice && data.lifestyleAdvice.length > 0) {
        console.log('💪 ПОБУТОВІ ПОРАДИ:\n');
        data.lifestyleAdvice.forEach((advice, i) => {
          console.log(`   ${i + 1}. ${advice}`);
        });
        console.log('');
      }

      console.log('═'.repeat(60));

    } else {
      console.log(`❌ AI Error: ${suggestions.data.message}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testAISuggestions();
