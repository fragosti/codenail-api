'use strict';

const Promise = require('bluebird');
const config = require('./config');
const stripe = require('stripe')(config.STRIPE_KEY);
const webshot = Promise.promisify(require('webshot'));
const fs = Promise.promisifyAll(require("fs"));
const createCharge = Promise.promisify(stripe.charges.create, { context: stripe.charges })
const dbClient = require('./db/dynamodb.js').client;
const s3 = require('./lib/s3.js');
const { respond, respondError, respondWarning} = require('./util/respond.js');


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
  const fileName = `${token.id}.png`
  createCharge({
    amount: price,
    currency: 'usd',
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
    return webshot(`${config.SITE_ADDR}/render/${token.id}`, fileName, {
      windowSize: {
        width: options.width*3,
        height: options.height*3,
      },
      renderDelay: 3000,
      phantomPath: config.PHANTOM_PATH,
    })
  })
  .then(() => fs.readFileAsync(fileName))
  .then((screenShot) => {
    return s3.putObjectAsync({
      Bucket: 'codenail-order-screenshots',
      Key: fileName,
      Body: screenShot,
      ContentType: 'image/png',
    })
  })
  .then(() => {
    respond(callback, { message: `Processed order: ${token.id} `})
  })
  .catch((error) => {
    console.log(error)
    respondError(callback, { error })
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
