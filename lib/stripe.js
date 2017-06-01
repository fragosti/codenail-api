const Promise = require('bluebird');
const config = require('../config');
const developmentConfig = require('../config/development.js');

module.exports = (isTest = false) => {
  const stripe = require('stripe')(isTest ? developmentConfig.STRIPE_KEY : config.STRIPE_KEY);
  return Promise.promisify(stripe.charges.create, { context: stripe.charges })
}