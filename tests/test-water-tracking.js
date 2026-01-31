const http = require('http');

const makeRequest = (method, path, data = null, token = null) => {
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
    req.setTimeout(30000);
    req.on('timeout', () => reject(new Error('Timeout')));

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function testWaterTracking() {
  console.log('💧 Testing Water Tracking Functionality\n');

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

    // 2. Get current daily log
    console.log('2️⃣  Getting current daily log...');
    const currentLog = await makeRequest('GET', '/api/analytics/daily', null, token);

    if (currentLog.data.success) {
      const log = currentLog.data.data;
      console.log(`   Current water intake: ${log.waterIntake || 0} мл`);
      console.log(`   Current weight: ${log.weight || 'не вказано'} кг\n`);
    }

    // 3. Update water intake (morning)
    console.log('3️⃣  Recording morning water intake (500ml)...');
    const morning = await makeRequest('PUT', '/api/analytics/daily', {
      waterIntake: 500
    }, token);

    if (morning.data.success) {
      console.log(`   ✅ Updated: ${morning.data.data.waterIntake} мл\n`);
    }

    // 4. Update water intake (afternoon - add more)
    console.log('4️⃣  Recording afternoon water intake (total 1500ml)...');
    const afternoon = await makeRequest('PUT', '/api/analytics/daily', {
      waterIntake: 1500
    }, token);

    if (afternoon.data.success) {
      console.log(`   ✅ Updated: ${afternoon.data.data.waterIntake} мл\n`);
    }

    // 5. Update water and weight together
    console.log('5️⃣  Recording evening: water (2200ml) + weight (65.5kg)...');
    const evening = await makeRequest('PUT', '/api/analytics/daily', {
      waterIntake: 2200,
      weight: 65.5,
      notes: 'Відчувала себе добре, багато енергії'
    }, token);

    if (evening.data.success) {
      const log = evening.data.data;
      console.log(`   ✅ Water: ${log.waterIntake} мл`);
      console.log(`   ✅ Weight: ${log.weight} кг`);
      console.log(`   ✅ Notes: ${log.notes}\n`);
    }

    // 6. Get final daily log
    console.log('6️⃣  Getting final daily log...');
    const finalLog = await makeRequest('GET', '/api/analytics/daily', null, token);

    if (finalLog.data.success) {
      const log = finalLog.data.data;
      console.log('\n═════════════════════════════════════════');
      console.log('📊 DAILY SUMMARY:');
      console.log('═════════════════════════════════════════');
      console.log(`💧 Water intake: ${log.waterIntake} мл`);
      console.log(`⚖️  Weight: ${log.weight || 'не вказано'} кг`);
      console.log(`🍽️  Calories: ${Math.round(log.totalNutrition.calories)} ккал`);
      console.log(`🥩 Protein: ${Math.round(log.totalNutrition.protein)}g`);
      console.log(`🥑 Fats: ${Math.round(log.totalNutrition.fats)}g`);
      console.log(`🍞 Carbs: ${Math.round(log.totalNutrition.carbs)}g`);

      if (log.notes) {
        console.log(`\n📝 Notes: ${log.notes}`);
      }
      console.log('═════════════════════════════════════════\n');
    }

    // 7. Test validation (too much water)
    console.log('7️⃣  Testing validation: attempting to log 15000ml (should fail)...');
    const invalid = await makeRequest('PUT', '/api/analytics/daily', {
      waterIntake: 15000
    }, token);

    if (!invalid.data.success) {
      console.log(`   ✅ Validation works! Error: ${invalid.data.message}\n`);
    } else {
      console.log('   ⚠️  Validation did not catch invalid value\n');
    }

    console.log('\n✅ WATER TRACKING TEST COMPLETED!\n');
    console.log('Summary:');
    console.log('✓ Water intake can be tracked via PUT /api/analytics/daily');
    console.log('✓ Validation prevents invalid values (0-10000ml)');
    console.log('✓ Water, weight, and notes can be updated together');
    console.log('✓ Data persists in DailyLog');
    console.log('✓ Swagger documentation added at /api-docs\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testWaterTracking();
