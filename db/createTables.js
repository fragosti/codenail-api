/**
* Used for development
*/

const dynamodb = require('./dynamodb.js').dynamodb

const orders = {
  TableName: "codenail-orders",
  KeySchema: [
    { AttributeName: "token", KeyType: "HASH"},
  ],
  AttributeDefinitions: [
    { AttributeName: "token", AttributeType: "S"},
  ],
  ProvisionedThroughput: {       
    ReadCapacityUnits: 10, 
    WriteCapacityUnits: 10,
  }
}

const shares = {
  TableName: "codenail-shares",
  KeySchema: [
    { AttributeName: "id", KeyType: "HASH"},
  ],
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S"},
  ],
  ProvisionedThroughput: {       
    ReadCapacityUnits: 10, 
    WriteCapacityUnits: 10,
  }
}

// Uncomment to create desired table
// dynamodb.createTable(shares, function(err, data) {
//     if (err) {
//         console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
//     } else {
//         console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
//     }
// });