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
function checkApiKey(apikey) {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    database: 'stripe',
    port: 5432,
  })

  client.connect()
    .then(() => console.log("Connected to database"))
    .catch(e => console.log('error', e.stack));

  const query = `SELECT * FROM customers WHERE api_key = '${apikey}'`;

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

module.exports = {
  insertCustomer,
  checkApiKey
}