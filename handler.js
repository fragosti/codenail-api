'use strict';

const Promise = require('bluebird');
const config = require('./config');
const webshot = Promise.promisify(require('webshot'));
const fs = require('./lib/fs.js');
const createChargeFn = require('./lib/stripe.js');
const dbClient = require('./db/dynamodb.js').client;
const img = require('./util/image.js');
const s3 = require('./lib/s3.js');
const email = require('./lib/email');
const shortid = require('shortid');
const { respond, respondError, respondWarning} = require('./util/respond.js');

module.exports.email = (event, content, callback) => {
  const key = event.Records[0].s3.object.key.split('.')[0]
  console.log(key)
  sendConfirmationEmail(key)
  .then(() => {
    respond(callback, {
      message: 'Email sent successfully!'
    })
  })
  .catch((error) => {
    respondError(callback, { error })
    console.log(error)
  })
}

const sendConfirmationEmail = (orderId) => {
  return getOrder(orderId)
  .then(({ Item }) => {
    const subject = 'Codenail Order Confirmation'
    const { charge } = Item
    return email.send({
      to: Item.email,
      subject,
    }, 'orderConfirmation', {
      name: charge.source.name,
      orderId,
      orderPrice: `$${charge.amount / 100}.00`,
      orderPreviewURL: `https://s3-us-west-2.amazonaws.com/codenail-order-previews/${orderId}.png`,
      orderDescription: charge.description,
    })
  })
}

module.exports.order = (event, content, callback) => {
  switch (event.httpMethod) {
    case 'POST':
      const { token, isTest, price, description, options } = JSON.parse(event.body);
      const newId = shortid.generate()
      return createOrder(newId, token, price, description, options, isTest)
        .then(() => {
          respond(callback, { 
            message: `Processed order`,
            id: newId
          })
        })
        .catch((error) => {
          console.log(error)
          respondError(callback, { error })
        })

    case 'GET':
      const { id } = event.pathParameters
      return getOrder(id)
        .then(data => respond(callback, data.Item))
        .catch((error) => {
          respondError(callback, { error })
          console.log(error)
        })
  }
}

const createOrder = (orderId, token, price, description, options, isTest) => {
  const fileName = `${orderId}.png`
  const filePath = `/tmp/${fileName}`
  const { width, height } = options
  return createChargeFn(isTest)({
    amount: price,
    currency: 'usd',
    description: description,
    source: token.id,
  })
  .then((charge) => {
    return dbClient.putAsync({
      TableName: 'codenail-orders',
      Item: {
        token: orderId,
        email: token.email,
        charge,
        options
      }
    })
  })
  .then((data) => {
    const zoomFactor = 4
    return webshot(`${config.SITE_ADDR}/render/${orderId}`, filePath, {
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
}

const getOrder = (id) => {
  return dbClient.getAsync({
    TableName: 'codenail-orders',
    Key: { token: id },
  })
}