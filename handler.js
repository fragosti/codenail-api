'use strict';

const Promise = require('bluebird');
const config = require("./config");
const stripe = require("stripe")(config.STRIPE_KEY);
const webshot = Promise.promisify(require('webshot'));
const createCharge = Promise.promisify(stripe.charges.create, { context: stripe.charges })
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
  createCharge({
    amount: price,
    currency: "usd",
    description: description,
    source: token.id,
  })
  .then((charge) => {
    return dbClient.putAsync({
      TableName: 'codenail-orders',
      Item: {
        token: token.id,
        charge,
        options
      }
    })
  })
  .then((data) => {
    return webshot(`${config.SITE_ADDR}/render/${token.id}`, `${token.id}.png`, {
      windowSize: {
        width: options.width*3,
        height: options.height*3,
      },
      renderDelay: 3000,
    })
  })
  .then(() => {
    respond(callback, { message: `Processed order: ${token.id} `})
  })
  .catch((error) => {
    respondError(callback, { error })
    console.log(error)
  })
}

const getOrder = (callback, id) => {
  dbClient.getAsync({
    TableName: 'codenail-orders',
    Key: { token: id },
  })
  .then(data => respond(callback, data.Item))
  .catch((error) => {
    respondError(callback, { error })
    console.log(error)
  })
}
