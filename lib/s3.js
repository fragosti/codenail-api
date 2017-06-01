const Promise = require('bluebird');
const AWS = require('./aws.js');

const s3 = new AWS.S3();

module.exports = Promise.promisifyAll(s3);

// Uncomment to create the bucket
// s3.createBucketAsync({
//   Bucket: 'codenail-order-screenshots'
// })
// .catch((error) => {
//   if (error.code !== 'BucketAlreadyOwnedByYou') {
//     console.log(error)
//   }
// })