const express = require('express');
const app = express();

const keys = require('./apiKeys');
const stripe = require('stripe')(keys.stripeKey);

const  generate = require('./apiKeyGen');

const database = require('./database');

//bullshit endpoint nobody will pay too use
app.get("/api", (req, res) => {

    //TODO change api key to pass from header
    const apiKey = req.query.apiKey;

    res.send({ data: "Listen here lochness monsta, im not giving you no tree fiddy" });
})

//creates checkout session through stripe
app.post("/checkout", async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: 'price_1PqQJ3GjxKqNlryzfZsh7RYH',
            },
        ],
        success_url: "http://localhost:8080/success",
        cancel_url: "http://localhost:8080/cancel",
    })
    res.send(session);
})

//mostly some boilerplate code to handle stripe webhooks
//TODO add logs to find where webhooks are failing
app.post("/webhook", async (req, res) => {
  let data;
  let eventType;
  
  //key from stripe to test webooks
  const webhookSecret = keys.webhookKey;

  if (webhookSecret) {

    let event;
    let signature = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(
        req['rawBody'],
        signature,
        webhookSecret
      );
      console.log(`✅  Webhook received: ${event.id}`);
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }

    data = event.data;
    eventType = event.type;
  } else {
   
    data = req.body.data;
    eventType = req.body.type;
  }

  switch (eventType) {
    case 'checkout.session.completed':
      console.log("Checkout session completed", data);

      const customerId = data.object.customer;
      const subscriptionId = data.object.subscription;

      console.log(`Customer ID: ${customerId} has subscribed to subscription ID: ${subscriptionId}`);

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const itemId = subscription.items.data[0].id;
      console.log(`Item ID: ${itemId}`);
      //TODO give customers access to api key and store hashed api key in database

      const { apiKey, hashedApiKey } = generate.generateApiKeys();
      console.log(`API Key: ${apiKey} Hashed API Key: ${hashedApiKey}`);

      database.insertCustomer(customerId, hashedApiKey, true);
      console.log(`Customer ID: ${customerId} has been added to the database`);

      break;
    case 'invoice.paid':
        console.log("Invoice paid");
      break;
    case 'invoice.payment_failed':
        console.log("Invoice payment failed");
      break;
    default:
  }

  res.sendStatus(200);
}) 

app.listen(8080, () => {console.log("Server is running on port 8080")});