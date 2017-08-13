const Promise = require('bluebird');
const webshot = Promise.promisify(require('webshot'));
const dbClient = require('../db/dynamodb.js').client;
const createChargeFn = require('../lib/stripe.js');
const pfOrder = require('../lib/printful/api.js').order;
const img = require('./image.js');
const s3 = require('../lib/s3.js');
const config = require('../config');
const fs = require('../lib/fs.js');


const get = (id) => {
  return dbClient.getAsync({
    TableName: 'codenail-orders',
    Key: { token: id },
  })
}


const create = (orderId, token, addresses, price, description, options, isTest, isPhone) => {
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
    let zoomFactor = img.zoomForSize(size)
    if (isPhone) {
      zoomFactor *= 2
    }
    const margin = 6 // margin in px
    const yMargin = (height/width)*margin
    return webshot(`${config.SITE_ADDR}/render/${orderId}?margin=${margin}`, filePath, {
      windowSize: { 
        width: (width + margin*2)*zoomFactor,
        height: (height + yMargin*2)*zoomFactor,
      },
      phantomPath: config.PHANTOM_PATH,
      renderDelay: 2000,
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

module.exports = {
  get,
  create
}