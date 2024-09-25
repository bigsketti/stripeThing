const express = require('express');
const app = express();

const keys = require('./apiKeys');
const stripe = require('stripe')(keys.stripeKey);

const  generate = require('./apiKeyGen');

const database = require('./database');

app.use(express.json({ verify: (req, res, buf) => {
  req.rawBody = buf.toString();  // Save the raw body for Stripe verification
}}));


//bullshit endpoint nobody will pay too use
app.get("/api", (req, res) => {

    //TODO change api key to pass from header
    const apiKey = req.query.apiKey;

    //TODO check if api key is in database
    let hashedApiKey = generate.hashApiKey(apiKey);
    const result = database.checkApiKey(hashedApiKey);

    if (result) {
        res.status(200).send({ data: "Listen here lochness monsta, im not giving you no tree fiddy" });
    } else {
        res.status(401).send({ data: "You are not authorized to use this api" });
    }
    
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

      break;
    case 'invoice.paid':
      console.log("Invoice paid");
      const { apiKey, hashedApiKey } = generate.generateApiKeys();
      console.log(`API Key: ${apiKey} Hashed API Key: ${hashedApiKey}`);

      if (apiKey === undefined || hashedApiKey === undefined) {
        console.log('error generating api key');
        return;
      }
      try {
        await database.insertCustomer(customerId, hashedApiKey, true);
        console.log(`Customer ID: ${customerId} has been added to the database`);
      }
      catch (err) {
        console.error("Error inserting into database", err);
      }

      break;
    case 'invoice.payment_failed':
        console.log("Invoice payment failed");
      break;
    default:
  }

  res.sendStatus(200);
}) 

app.listen(8080, () => {console.log("Server is running on port 8080")});