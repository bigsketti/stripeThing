const { Client } = require('pg');
const keys = require('./apiKeys');

const client = new Client({
    host: 'localhost',
    user: 'mason',
    password: keys.dbKey,
    database: 'stripe',
    port: 5432,
  })

  client.connect()
    .then(() => console.log("Connected to database"))
    .catch(e => console.log('error', e));

//adds customer to track api keys
function insertCustomer(apiKey, active, itemId) {
    const query = `INSERT INTO customers (apiKey, active, itemId) VALUES ('${apiKey}', '${active}', '${itemId}') RETURNING *`;

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

//pushes api key to database
function insertApiKeys(apiKey) {
    const query = `INSERT INTO apiKeys (apiKey) VALUES ('${apiKey}') RETURNING *`;

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
    const query = `SELECT * FROM customers WHERE apiKey = '${apikey}'`;

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
    checkApiKey,
    insertApiKeys
}