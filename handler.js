'use strict';

const email = require('./lib/email');
const share = require('./util/share.js');
const preview = require('./util/preview.js');
const order = require('./util/order.js');
const shortid = require('shortid');
const hash = require('./util/hash.js');
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
  const { name, address1, city, state_code, zip, country_code } = recipient
  return email.send({
    to: recipient.email,
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
  return order.get(orderId)
  .then(({ Item }) => {
    const subject = 'Codenail Order Confirmation'
    const { charge, justDownload } = Item
    return email.send({
      to: Item.email,
      subject,
    }, 'orderConfirmation', {
      name: charge.source.name,
      orderId,
      justDownload,
      orderPrice: `$${charge.amount / 100}.00`,
      orderPreviewURL: `https://s3-us-west-2.amazonaws.com/codenail-order-previews/${orderId}.png`,
      orderDownloadURL: `https://s3-us-west-2.amazonaws.com/codenail-order-screenshots/${orderId}.png`,
      orderDescription: charge.description,
    })
  })
}

module.exports.order = (event, content, callback) => {
  switch (event.httpMethod) {
    case 'POST':
      const { token, addresses, isTest, isPhone, price, description, options, justDownload } = JSON.parse(event.body);
      const newId = shortid.generate()
      return order.create(newId, token, addresses, price, description, options, isTest || process.env.NODE_ENV == 'development', isPhone, justDownload)
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
      return order.get(id)
        .then(data => respond(callback, data.Item))
        .catch((error) => {
          respondError(callback, { error })
          console.log(error)
        })
  }
}

module.exports.preview = (event, content, callback) => {
  switch(event.httpMethod) {
    case 'POST':
      const id = hash(event.body)
      const { options, isPhone } = JSON.parse(event.body);
      return share.get(id).then((share) => {
        if (Object.keys(share).length) {
          return { previewId: id }
        }
        return preview.create(options, isPhone, id)
      })
      .then(({ previewId }) => {
        respond(callback, {
          previewId
        })
      })
      .catch((error) => {
        respondError(callback, { error })
      })
  }
}

module.exports.share = (event, content, callback) => {
  switch(event.httpMethod) {
    case 'POST':
      const { options } = JSON.parse(event.body);
      const newId = shortid.generate()
      return share.create(newId, options)
        .then(() => {
          respond(callback, {
            message: 'Share saved successfully',
            id: newId
          })
        })
        .catch((error) => {
          respondError(callback, { error })
        })
    case 'GET':
      const { id } = event.pathParameters
      return share.get(id)
        .then((data) => {
          respond(callback, data.Item)
        })
        .catch((error) => {
          console.log(error)
          respondError(callback, { error })
        })
  }
}