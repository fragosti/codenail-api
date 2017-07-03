'use strict';

const Promise = require('bluebird');
const config = require('./config');
const webshot = Promise.promisify(require('webshot'));
const fs = require('./lib/fs.js');
const pfOrder = require('./lib/printful/api.js').order;
const createChargeFn = require('./lib/stripe.js');
const dbClient = require('./db/dynamodb.js').client;
const img = require('./util/image.js');
const s3 = require('./lib/s3.js');
const email = require('./lib/email');
const shortid = require('shortid');
const { respond, respondError, respondWarning} = require('./util/respond.js');

module.exports.email = (event, content, callback) => {
  let emailPromise = null
  if (event.httpMethod === 'POST') {
    const { shipment, order } = JSON.parse(event.body).data;
    emailPromise = sendShippingConfirmationEmail(shipment, order)
  } else {
    const key = event.Records[0].s3.object.key.split('.')[0]
    console.log(key)
    emailPromise = sendOrderConfirmationEmail(key)
  }
  emailPromise
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

const sendShippingConfirmationEmail = (shipment, order) => {
  const { tracking_number, tracking_url } = shipment
  const { external_id, recipient } = order
  const { name, address1, city, state_code, zip, country_code, email } = recipient
  return send({
    to: email,
    subject: 'Your Codenail poster has shipped!',
  }, 'shippingConfirmation', 
  {
    name,
    orderId: external_id,
    tracking_number,
    tracking_url,
    address1,
    city,
    state_code,
    zip,
    country: country_code
  })
}

const sendOrderConfirmationEmail = (orderId) => {
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
      const { token, addresses, isTest, price, description, options } = JSON.parse(event.body);
      const newId = shortid.generate()
      return createOrder(newId, token, addresses, price, description, options, isTest || process.env.NODE_ENV == 'development')
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

const createOrder = (orderId, token, addresses, price, description, options, isTest) => {
  const fileName = `${orderId}.png`
  const filePath = `/tmp/${fileName}`
  const { width, height, size } = options
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
      windowSize: { // Add padding to picture. Dependency on frontend 4px padding.
        width: (width + 8)*zoomFactor,
        height: (height + 8)*zoomFactor,
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
    const { 
      shipping_name, 
      shipping_address_line1, 
      shipping_address_city,
      shipping_address_state,
      shipping_address_country_code,
      shipping_address_zip
    } = addresses
    return pfOrder(orderId, size, options.framed, {
      name: shipping_name,
      address1: shipping_address_line1,
      city: shipping_address_city,
      state_code: shipping_address_state,
      country_code: shipping_address_country_code,
      zip: shipping_address_zip,
      email: token.email, // important for printful shipment confirmation webhook
    }, { isTest })
  })
}

const getOrder = (id) => {
  return dbClient.getAsync({
    TableName: 'codenail-orders',
    Key: { token: id },
  })
}