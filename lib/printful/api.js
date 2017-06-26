const Promise = require('bluebird');
const PrintfulClient = require('./client.js');
const variantIdForSize = {
  '8x10': 4463,
  '10x10': 6239,
  '12x12': 4464,
  '12x16': 1349,
  '14x14': 6240,
  '16x16': 4465,
  '12x18': 3876,
  '18x18': 6242,
  '16x20': 3877,
  '18x24': 1,
  '24x36': 2,
};

const API_KEY = 'yzsdqemf-2s5v-j655:nhbg-ptl5apqfwxoq'

const order = (orderId, size, recipient, options = {}) => {
  const { isTest } = options
  console.log(isTest)
  const pf = new PrintfulClient(API_KEY)
  return new Promise((resolve, reject) => {
    pf.post('orders', {
      external_id: orderId,
      recipient,
      items: [
        {
          variant_id: variantIdForSize[size],
          quantity: 1,
          files: [
            {
              url: `https://s3-us-west-2.amazonaws.com/codenail-order-screenshots/${orderId}.png`
            }
          ]
        }
      ]
    },
    {
      confirm: isTest ? 0 : 1,
    }).success(resolve).error(reject)
  })
}

module.exports = order


    //Create an order and confirm immediately
/*
    pf.post('orders',
        {
            recipient:  {
                name: 'John Doe',
                address1: '19749 Dearborn St',
                city: 'Chatsworth',
                state_code: 'CA',
                country_code: 'US',
                zip: '91311'
            },
            items: [
                {
                    variant_id: 1, //Small poster
                    name: 'Niagara Falls poster', //Display name
                    retail_price: '19.99', //Retail price for packing slip
                    quantity: 1,
                    files: [
                        {url: 'http://example.com/files/posters/poster_1.jpg'}
                    ]
                }
            ]
        },
        {confirm: 1}
    ).success(ok_callback).error(error_callback);
*/

// Request
// {
//     "external_id": "9887112",
//     "recipient": {
//         "name": "John Doe",
//         "address1": "19749 Dearborn St",
//         "city": "Chatsworth",
//         "state_code": "CA",
//         "country_code": "US",
//         "zip": "91311"
//     },
//     "items": [{
//         "variant_id": 2,
//         "quantity": 1,
//         "name": "Niagara Falls poster",
//         "retail_price": "19.99",
//         "files": [{
//             "url": "http://example.com/files/posters/poster_2.jpg"
//         }]
//     }, {
//         "variant_id": 1,
//         "quantity": 3,
//         "name": "Grand Canyon poster",
//         "retail_price": "17.99",
//         "files": [{
//             "url": "http://example.com/files/posters/poster_3.jpg"
//         }]
//     }],
//     "retail_costs": {
//         "shipping": "24.50"
//     }
// }

// Response
// {
//     "code": 200,
//     "result": {
//         "id": 21509,
//         "external_id": "9887112",
//         "status": "draft",
//         "shipping": "STANDARD",
//         "created": 1390825006,
//         "updated": 1390825006,
//         "recipient": {
//             "name": "John Doe",
//             "company": null,
//             "address1": "19749 Dearborn St",
//             "address2": null,
//             "city": "Chatsworth",
//             "state_code": "CA",
//             "state_name": "California",
//             "country_code": "US",
//             "country_name": "United States",
//             "zip": "91311",
//             "phone": null,
//             "email": null
//         },
//         "items": [{
//             "id": 17619,
//             "external_id": null,
//             "variant_id": 2,
//             "quantity": 1,
//             "price": "18.00",
//             "retail_price": "19.99",
//             "name": "Niagara Falls poster",
//             "product": {
//                 "variant_id": 2,
//                 "product_id": 1,
//                 "image": "https://www.printful.com/storage/products/poster_24x36.jpg",
//                 "name": "Unframed Poster 24×36"
//             },
//             "files": [{
//                 "id": 11819,
//                 "type": "default",
//                 "hash": null,
//                 "url": "http://example.com/files/posters/poster_2.jpg",
//                 "filename": null,
//                 "mime_type": null,
//                 "size": 0,
//                 "width": null,
//                 "height": null,
//                 "dpi": null,
//                 "status": "waiting",
//                 "created": 1390824712,
//                 "thumbnail_url": null,
//                 "preview_url": null,
//                 "visible": true
//             }],
//             "options": []
//         }, {
//             "id": 17620,
//             "external_id": null,
//             "variant_id": 1,
//             "quantity": 3,
//             "price": "13.00",
//             "retail_price": "17.99",
//             "name": "Grand Canyon poster",
//             "product": {
//                 "variant_id": 1,
//                 "product_id": 1,
//                 "image": "https://www.printful.com/storage/products/poster_18x24.jpg",
//                 "name": "Unframed Poster 18×24"
//             },
//             "files": [{
//                 "id": 11820,
//                 "type": "default",
//                 "hash": null,
//                 "url": "http://example.com/files/posters/poster_3.jpg",
//                 "filename": null,
//                 "mime_type": null,
//                 "size": 0,
//                 "width": null,
//                 "height": null,
//                 "dpi": null,
//                 "status": "waiting",
//                 "created": 1390824712,
//                 "thumbnail_url": null,
//                 "preview_url": null,
//                 "visible": true
//             }],
//             "options": []
//         }],
//         "costs": {
//             "subtotal": "57.00",
//             "discount": "0.00",
//             "shipping": "9.95",
//             "tax": "5.13",
//             "total": "72.08"
//         },
//         "retail_costs": {
//             "subtotal": "73.96",
//             "discount": "0.00",
//             "shipping": "24.50",
//             "tax": "0.00",
//             "total": "98.46"
//         },
//         "shipments": []
//     }
// }