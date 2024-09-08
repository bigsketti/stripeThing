const database = require('./database');

//creates api key for new customer
function generateApiKeys() {
  const { randomBytes } = require('crypto');
  const apiKey = randomBytes(32).toString('hex');
  const hashedApiKey = hashApiKey(apiKey);

  if (database.checkApiKey(hashedApiKey)) {
    generateApiKeys();
  } else {
    console.log(`API Key: ${apiKey} Hashed API Key: ${hashedApiKey}`);
    return { apiKey, hashedApiKey };
  }
}

//hashes api key for storage
function hashApiKey(apiKey) {
  const { createHash } = require('crypto');
  const hashedApiKey = createHash('sha256').update(apiKey).digest('hex');

  return hashedApiKey;
}

module.exports = generateApiKeys;