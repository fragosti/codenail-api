'use strict';

const email = require('./util/email.js');
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
    emailPromise = email.sendShippingConfirmationEmail(shipment, order)
  } else {
    const key = event.Records[0].s3.object.key.split('.')[0]
    console.log(key)
    emailPromise = email.sendOrderConfirmationEmail(key)
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
          console.log(error)
          respondError(callback, { error })
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