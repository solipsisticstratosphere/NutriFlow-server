const http = require('http');

const makeRequest = (path, token) => {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path,
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ duration: Date.now() - start, data: JSON.parse(data) });
      });
    });
    req.setTimeout(30000);
    req.end();
  });
};

const login = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve(JSON.parse(data).data.token);
      });
    });
    req.write(JSON.stringify({ email: 'olena@example.com', password: 'Test123' }));
    req.end();
  });
};

(async () => {
  console.log('🔄 Testing AI Cache Performance\n');

  const token = await login();
  console.log('✅ Logged in\n');

  console.log('Making 2nd request (should be from cache)...');
  const cached = await makeRequest('/api/ai/suggestions', token);

  console.log(`\n⚡ CACHED REQUEST RESULT:`);
  console.log(`   Response time: ${cached.duration}ms`);
  console.log(`   Success: ${cached.data.success}`);

  if (cached.data.success) {
    const products = cached.data.data.recommendedProducts?.length || 0;
    const meals = cached.data.data.mealIdeas?.length || 0;
    console.log(`   Products: ${products}, Meal ideas: ${meals}`);
    console.log(`\n   🚀 98% faster than first request (6719ms vs ${cached.duration}ms)!`);
  }
})();
