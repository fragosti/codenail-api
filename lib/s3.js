const Promise = require('bluebird');
const AWS = require('./aws.js');

const s3 = new AWS.S3();

module.exports = s3;