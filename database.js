const { Client } = require('pg');
const keys = require('./apiKeys');

//adds customer to track api keys
function insertCustomer(customerId, apiKey, active) {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    database: 'stripe',
    port: 5432,
  })

  client.connect()
    .then(() => console.log("Connected to database"))
    .catch(e => console.log('error', e.stack));

    const query = `INSERT INTO customers (customer_id, api_key, active) VALUES ('${customerId}', '${apiKey}', '${active}') RETURNING *`;

    client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        return;
      } else {
        console.log(res.rows[0]);
      }

    client.end();
    })
}

//checks if api key is in database
async function checkApiKey(apikey) {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    database: 'stripe',
    port: 5432,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    const query = 'SELECT * FROM customers WHERE api_key = $1';
    const res = await client.query(query, [apikey]);

    if (res.rows.length > 0) {
      console.log(res.rows[0]);
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error('Database query error:', err);
    return false;
  } finally {
    await client.end(); // Ensure client is always closed
  }
}

module.exports = {
  insertCustomer,
  checkApiKey
}