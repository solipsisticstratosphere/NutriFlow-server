const http = require('http');

const makeRequest = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.setTimeout(10000);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  try {
    // Test 1: Root endpoint
    console.log('1️⃣  Testing root endpoint...');
    const root = await makeRequest('GET', '/');
    console.log(`   Status: ${root.status}`);
    console.log(`   Message: ${root.data.message}`);
    console.log(`   ✅ Root endpoint working\n`);

    // Test 2: Registration with invalid data (missing password)
    console.log('2️⃣  Testing validation - invalid registration...');
    const invalidReg = await makeRequest('POST', '/api/auth/register', {
      name: 'Test',
      email: 'test@test.com'
    });
    console.log(`   Status: ${invalidReg.status}`);
    console.log(`   Success: ${invalidReg.data.success}`);
    console.log(`   ${invalidReg.status === 400 ? '✅' : '❌'} Validation working\n`);

    // Test 3: Valid registration
    console.log('3️⃣  Testing user registration...');
    const timestamp = Date.now();
    const regData = {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'Test123',
      profile: {
        age: 25,
        gender: 'male',
        weight: 70,
        height: 175,
        activityLevel: 'moderate',
        goal: 'maintain'
      }
    };

    const register = await makeRequest('POST', '/api/auth/register', regData);
    console.log(`   Status: ${register.status}`);
    console.log(`   Success: ${register.data.success}`);
    console.log(`   Response data:`, JSON.stringify(register.data).substring(0, 200));

    if (register.data.success && register.data.data) {
      const token = register.data.data.token;
      const user = register.data.data.user || register.data.data;
      const userId = user._id;
      console.log(`   User ID: ${userId}`);
      console.log(`   Daily Norms: ${JSON.stringify(register.data.data.dailyNorms)}`);
      console.log(`   ✅ Registration successful\n`);

      // Test 4: Login
      console.log('4️⃣  Testing login...');
      const login = await makeRequest('POST', '/api/auth/login', {
        email: regData.email,
        password: regData.password
      });
      console.log(`   Status: ${login.status}`);
      console.log(`   Success: ${login.data.success}`);
      console.log(`   ${login.data.success ? '✅' : '❌'} Login working\n`);

      // Test 5: Get user profile
      console.log('5️⃣  Testing protected route /api/auth/me...');
      const meReq = http.request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   User: ${parsed.data.name}`);
          console.log(`   ${parsed.success ? '✅' : '❌'} Auth middleware working\n`);
          continueTests(token);
        });
      });
      meReq.on('error', console.error);
      meReq.end();

    } else {
      console.log(`   ❌ Registration failed: ${register.data.message}\n`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

async function continueTests(token) {
  try {
    // Test 6: Create product
    console.log('6️⃣  Testing product creation...');
    const productReq = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/products',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Success: ${parsed.success}`);
        if (parsed.success) {
          console.log(`   Product: ${parsed.data.name}`);
          console.log(`   ✅ Product creation working\n`);
        } else {
          console.log(`   ❌ Error: ${parsed.message}\n`);
        }
      });
    });

    const productData = JSON.stringify({
      name: 'Test Banana',
      category: 'Fruits',
      nutritionPer100g: {
        calories: 89,
        protein: 1.1,
        fats: 0.3,
        carbs: 22.8
      }
    });

    productReq.write(productData);
    productReq.end();

    // Test 7: Get products with pagination
    setTimeout(async () => {
      console.log('7️⃣  Testing products pagination...');
      const productsReq = http.request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/products?page=1&limit=10',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Count: ${parsed.count}`);
          console.log(`   Pagination: currentPage=${parsed.pagination?.currentPage}, totalPages=${parsed.pagination?.totalPages}`);
          console.log(`   ${parsed.pagination ? '✅' : '❌'} Pagination working\n`);

          console.log('\n✅ All tests completed!');
          process.exit(0);
        });
      });
      productsReq.end();
    }, 1000);

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

runTests();
