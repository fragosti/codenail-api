const email = require('../lib/email');
const order = require('./order.js');

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
    const { charge, justDownload, options } = Item
    const isShirtOrder = options.productType === 'shirt'
    return email.send({
      to: Item.email,
      subject,
    }, 'orderConfirmation', {
      name: charge.source.name,
      orderId,
      justDownload,
      orderPrice: `$${charge.amount / 100}.00`,
      orderPreviewURL: isShirtOrder ? null : `https://s3-us-west-2.amazonaws.com/codenail-order-previews/${orderId}.png`,
      orderDownloadURL: `https://s3-us-west-2.amazonaws.com/codenail-order-screenshots/${orderId}.png`,
      orderDescription: charge.description,
    })
  })
}

module.exports = {
  sendOrderConfirmationEmail,
  sendShippingConfirmationEmail,
}