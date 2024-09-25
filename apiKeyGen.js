const database = require('./database');

//creates api key for new customer
async function generateApiKeys() {
  const { randomBytes } = require('crypto');
  const apiKey = randomBytes(32).toString('hex');
  const hashedApiKey = hashApiKey(apiKey);

  const result = await database.checkApiKey(hashedApiKey);

  if (result) {
    console.log('duplicate api key found, regenerating');
    generateApiKeys();
  } else if (apiKey === undefined || hashedApiKey === undefined) {
    console.log('error generating api key');
    return;
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

module.exports = { generateApiKeys, hashApiKey };