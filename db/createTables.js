/**
* Used for development
*/

const dynamodb = require('./dynamodb.js').dynamodb

const params = {
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


dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});