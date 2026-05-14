require('dotenv').config();

const uri = process.env.TEST_MONGODB_URI;

if (!uri) {
  console.error('❌ TEST_MONGODB_URI не знайдено в .env');
  process.exit(1);
}

if (!uri.includes('test')) {
  console.error('❌ TEST_MONGODB_URI не містить "test" у назві бази даних.');
  process.exit(1);
}

process.env.MONGODB_URI = uri;
process.env.PORT = process.env.TEST_PORT || 5001;

console.log(`🧪 Starting TEST server on port ${process.env.PORT}`);
console.log(`🗄️  Database: ${uri.split('/').pop().split('?')[0]}\n`);

require('../server');
