const Promise = require('bluebird');
const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: process.env.NODE_ENV === 'development' ? "http://localhost:8001" : undefined
});

module.exports.dynamodb = new AWS.DynamoDB();

const client = new AWS.DynamoDB.DocumentClient();

module.exports.client = Promise.promisifyAll(client)