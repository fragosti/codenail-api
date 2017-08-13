const moment = require('moment');
const dbClient = require('../db/dynamodb.js').client;


const create = (id, options) => {
  return dbClient.putAsync({
    TableName: 'codenail-shares',
    Item: {
      id,
      ttl: moment().add(7,'days').unix(),
      options,
    }
  })
}

const get = (id) => {
  return dbClient.getAsync({
    TableName: 'codenail-shares',
    Key: { id }
  })
}

module.exports = {
  create,
  get,
}