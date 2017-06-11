const Promise = require('bluebird');
const hb = require('handlebars');
const fs = require('../fs.js');
const ses = require('../ses.js');

// var template = Handlebars.compile(source);
// var context = {title: "My New Post", body: "This is my first post!"};
// var html    = template(context);


const generateEmailTemplate = (name) => {
  return fs.readFileAsync(`templates/${name}.html`, 'utf8')
    .then(hb.compile)
    .catch(console.log)
}

/**
send({
  to: 'agostif93@gmail.com',
  subject: 'Hey!',
},'orderConfirmation', {
  name: 'Francesco',
  subject: 'LOL',
  orderId: 'ererwer3r',
  orderPrice: '$46',
  orderPreviewURL: 'https://s3-us-west-2.amazonaws.com/codenail-order-previews/tok_1AR8r4GfwDRSSzvIXpv7j1fK.png',
  orderDescription: 'A super awesome poster',
})
*/
const send = (info, name, context) => {
  generateEmailTemplate(name)
  .then((template) => {
    const body = template(context)
    const params = {
      Destination: {
        ToAddresses: [
            info.to
        ]
      },
      Message: {
        Subject: {
          Data: info.subject
        },
        Body: {
          Html: {
            Data: body,
            Charset: 'UTF-8'
          }
        }
      },
      Source: 'francesco@codenail.com'
    };
    return ses.sendEmail(params).promise();
  })
}

module.exports = {
  send,
}

