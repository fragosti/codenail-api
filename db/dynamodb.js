const Promise = require('bluebird');
const AWS = require('../lib/aws.js');

module.exports.dynamodb = new AWS.DynamoDB();

const client = new AWS.DynamoDB.DocumentClient();

module.exports.client = Promise.promisifyAll(client)