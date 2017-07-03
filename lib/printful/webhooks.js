const PrintfulClient = require('./client.js');
const pf = require('./api.js').pf;

// Execute this file to enable the desired webhooks.
const enabledWebhooks = (url, types) => {
  pf.post('webhooks', {
    url,
    types,
  }).success(console.log).error(console.log)
}

enabledWebhooks(
  'https://t46e391x1a.execute-api.us-west-2.amazonaws.com/production/email',
  ['package_shipped']
)