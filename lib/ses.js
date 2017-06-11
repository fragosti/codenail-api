const AWS = require('./aws.js');

module.exports = new AWS.SES({apiVersion: '2010-12-01'})