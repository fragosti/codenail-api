const Promise = require('bluebird');
const dbClient = require('../db/dynamodb.js').client;
const createChargeFn = require('../lib/stripe.js');
const pfOrder = require('../lib/printful/api.js').order;
const img = require('./image.js');


const get = (id) => {
  return dbClient.getAsync({
    TableName: 'codenail-orders',
    Key: { token: id },
  })
}


const create = (orderId, token, addresses, price, description, options, isTest, isPhone, justDownload) => {
  const { width, height, size } = options
  const chargeAndUpload = createChargeFn(isTest)({
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
        justDownload,
        options, // optional but why not
      }
    })
  })
  .then((data) => img.takeScreenShot(isPhone, options, orderId))
  .then(({ filePath, fileName }) => Promise.all([
    img.upload(fileName, filePath, 'codenail-order-screenshots'),
    img.upload(fileName, filePath, 'codenail-order-previews', { width, height }),
  ]))
  if (justDownload) {
    return chargeAndUpload
  } else {
    return chargeAndUpload.then(() => {
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
      }, options.amount, { isTest })
    })
  }
  
}

module.exports = {
  get,
  create
}