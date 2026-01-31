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

async function test() {
  console.log('Testing validation...\n');

  // Login
  const login = await makeRequest('POST', '/api/auth/login', {
    email: 'olena@example.com',
    password: 'Test123'
  });

  const token = login.data.data.token;

  // Test 1: Valid water intake
  console.log('Test 1: Valid water intake (2000ml)');
  const valid = await makeRequest('PUT', '/api/analytics/daily', {
    waterIntake: 2000
  }, token);
  console.log(`Status: ${valid.status}`);
  console.log(`Response:`, JSON.stringify(valid.data, null, 2), '\n');

  // Test 2: Invalid - too much water
  console.log('Test 2: Invalid water intake (15000ml)');
  const invalid1 = await makeRequest('PUT', '/api/analytics/daily', {
    waterIntake: 15000
  }, token);
  console.log(`Status: ${invalid1.status}`);
  console.log(`Response:`, JSON.stringify(invalid1.data, null, 2), '\n');

  // Test 3: Invalid - negative water
  console.log('Test 3: Invalid water intake (-100ml)');
  const invalid2 = await makeRequest('PUT', '/api/analytics/daily', {
    waterIntake: -100
  }, token);
  console.log(`Status: ${invalid2.status}`);
  console.log(`Response:`, JSON.stringify(invalid2.data, null, 2), '\n');

  // Test 4: Invalid - weight too high
  console.log('Test 4: Invalid weight (600kg)');
  const invalid3 = await makeRequest('PUT', '/api/analytics/daily', {
    weight: 600
  }, token);
  console.log(`Status: ${invalid3.status}`);
  console.log(`Response:`, JSON.stringify(invalid3.data, null, 2), '\n');
}

test();
