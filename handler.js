'use strict';

const Promise = require('bluebird');
const config = require('./config');
const webshot = Promise.promisify(require('webshot'));
const fs = Promise.promisifyAll(require("fs"));
const createChargeFn = require('./lib/stripe.js');
const dbClient = require('./db/dynamodb.js').client;
const s3 = require('./lib/s3.js');
const { respond, respondError, respondWarning} = require('./util/respond.js');


module.exports.order = (event, content, callback) => {
  switch (event.httpMethod) {
    case 'POST':
      const { token, isTest, price, description, options } = JSON.parse(event.body);
      return createOrder(callback, token, price, description, options, isTest)
    case 'GET':
      const { id } = event.pathParameters
      return getOrder(callback, id)
  }
}

const createOrder = (callback, token, price, description, options, isTest) => {
  const fileName = `${token.id}.png`
  const filePath = `/tmp/${fileName}`
  createChargeFn(isTest)({
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
    const zoom = 4
    return webshot(`${config.SITE_ADDR}/render/${token.id}?zoom=${zoom}`, filePath, {
      windowSize: {
        width: options.width*zoom,
        height: options.height*zoom,
      },
      renderDelay: 3000,
      phantomPath: config.PHANTOM_PATH,
    })
  })
  .then(() => fs.readFileAsync(filePath))
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
