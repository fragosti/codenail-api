'use strict';

const Promise = require('bluebird');
const config = require('./config');
const webshot = Promise.promisify(require('webshot'));
const fs = Promise.promisifyAll(require("fs"));
const createChargeFn = require('./lib/stripe.js');
const dbClient = require('./db/dynamodb.js').client;
const img = require('./util/image.js');
const s3 = require('./lib/s3.js');
const shortid = require('shortid');
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
  const id = shortid.generate()
  const fileName = `${id}.png`
  const filePath = `/tmp/${fileName}`
  const { width, height } = options
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
        token: id,
        email: token.email,
        charge,
        options
      }
    })
  })
  .then((data) => {
    const zoomFactor = 4
    return webshot(`${config.SITE_ADDR}/render/${id}`, filePath, {
      windowSize: {
        width: width*zoomFactor,
        height: height*zoomFactor,
      },
      phantomPath: config.PHANTOM_PATH,
      renderDelay: 3000,
      takeShotOnCallback: true,
      zoomFactor,
    })
  })
  .then(() => Promise.all([
    fs.readFileAsync(filePath).then((screenShot) => {
      return s3.putObjectAsync({
        Bucket: 'codenail-order-screenshots',
        Key: fileName,
        Body: screenShot,
        ContentType: 'image/png',
      })
    }),
    img.resize(filePath, Math.round(width), Math.round(height))
    .then((orderPreview) => {
      return s3.putObjectAsync({
        Bucket: 'codenail-order-previews',
        Key: fileName,
        Body: orderPreview,
        ContentType: 'image/png',
      })
    })
  ]))
  .then(() => {
    respond(callback, { 
      message: `Processed order`,
      id: id
    })
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
