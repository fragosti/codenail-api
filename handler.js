'use strict';

const stripe = require("stripe")(process.env.STRIPE_KEY);
const dbClient = require("./db/dynamodb.js").client;
const { respond, respondError, respondWarning} = require('./util/respond.js');

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.order = (event, content, callback) => {
  switch (event.httpMethod) {
    case 'POST':
      const { token, price, description, options } = JSON.parse(event.body);
      return createOrder(callback, token, price, description, options)
    case 'GET':
      const { id } = event.pathParameters
      return getOrder(callback, id)
  }
}

const createOrder = (callback, token, price, description, options) => {
  // TODO: promisify
  const charge = stripe.charges.create({
    amount: price,
    currency: "usd",
    description: description,
    source: token.id,
  }, (error, charge) => {
    if (error) {
      respondError(callback, { error })
      console.log(error)
      return
    } 
    dbClient.put({
      TableName: 'codenail-orders',
      Item: {
        token: token.id,
        options
      }
    }, (error, data) => {
      if (error) {
        respondError(callback, { error })
        console.log(error)
        return
      }
      respond(callback, { message: `Processed order: ${token.id} `})
    })
  });
}

const getOrder = (callback, id) => {
  dbClient.get({
    TableName: 'codenail-orders',
    Key: { token: id },
  }, (error, data) => {
    if (error) {
      console.log(error)
      respondError(callback, { error })
      return
    }
    respond(callback, data.Item)
  })
}
