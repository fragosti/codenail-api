const Promise = require('bluebird');
const PrintfulClient = require('./client.js');

const API_KEY = 'yzsdqemf-2s5v-j655:nhbg-ptl5apqfwxoq'
const pf = new PrintfulClient(API_KEY)

const flipAround = (str, char) => {
  const sStr = str.split(char)
  return `${sStr[1]}${char}${sStr[0]}`
} 

const variantIdForPosterSize = {
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

const variantIdForFramedPosterSize = {
  '8x10': 4651,
  '10x10': 4652,
  '12x12': 4653,
  '12x16': 1350,
  '14x14': 4654,
  '16x16': 4655,
  '12x18': 4398,
  '18x18': 4656,
  '16x20': 4399,
  '18x24': 3,
  '24x36': 4,
};

const variantIdForShirt = {
  'white': {
    'S': 4011,
    'M': 4012,
    'L': 4013,
    'XL': 4014,
    '2XL': 4015,
    '3XL': 5294,
    '4XL': 5309,
  },
  'red': {
    'S': 4141,
    'M': 4142,
    'L': 4143,
    'XL': 4144,
    '2XL': 4145,
    '3XL': 5304,
    '4XL': 5319,
  },
  'black': {
    'S': 4016,
    'M': 4017,
    'L': 4018,
    'XL': 4019,
    '2XL': 4020,
    '3XL': 5295,
    '4XL': 5310,
  },
  'pink': {
    'S': 4136,
    'M': 4137,
    'L': 4138,
    'XL': 4139,
    '2XL': 4140,
    '3XL': 5303,
    '4XL': 5318,
  },
  'yellow': {
    'S': 4181,
    'M': 4182,
    'L': 4183,
    'XL': 4184,
    '2XL': 4185,
    '3XL': 5308,
    '4XL': 5323,
  },
  'deep-heather': {
    'S': 8467,
    'M': 8468,
    'L': 8469,
    'XL': 8470,
    '2XL': 8471,
    '3XL': 8472,
    '4XL': 8473,
  },
  'athletic-heather': {
    'S': 6948,
    'M': 6949,
    'L': 6950,
    'XL': 6951,
    '2XL': 6952,
    '3XL': 6953,
    '4XL': 6954,
  },
  'heather-navy': {
    'S': 8509,
    'M': 8510,
    'L': 8511,
    'XL': 8512,
    '2XL': 8513,
    '3XL': 8514,
    '4XL': 8515,
  },
  'asphalt': {
    'S': 4031,
    'M': 4032,
    'L': 4033,
    'XL': 4034,
    '2XL': 4035,
    '3XL': 5297,
    '4XL': 5312,
  },
  'berry': {
    'S': 4041,
    'M': 4042,
    'L': 4043,
    'XL': 4044,
    '2XL': 4045,
    '3XL': 5298,
    '4XL': 5313,
  },
  'aqua': {
    'S': 4021,
    'M': 4022,
    'L': 4023,
    'XL': 4024,
    '2XL': 4025,
    '3XL': 5296,
    '4XL': 5311,
  },
  'kelly': {
    'S': 4086,
    'M': 4087,
    'L': 4088,
    'XL': 4089,
    '2XL': 4090,
    '3XL': 5300,
    '4XL': 5315,
  },
}

const variantId = (productType, size, isFramed, shirtSize, shirtColor) => {
  switch(productType) {
    case 'poster':
      return isFramed ? 
        (variantIdForFramedPosterSize[size] || variantIdForFramedPosterSize[flipAround(size, 'x')]) : 
        (variantIdForPosterSize[size] || variantIdForPosterSize[flipAround(size, 'x')])
    case 'shirt':
      return variantIdForShirt[shirtColor][shirtSize]
    default:
      throw new Error(`Provided an invalid productType:${productType}`)
  }
}

const order = (orderId, options, recipient, isTest = false) => {
  const { productType, size, framed, shirtSize, shirtColor, amount } = options
  return new Promise((resolve, reject) => {
    pf.post('orders', {
      external_id: orderId,
      recipient,
      items: [
        {
          variant_id: variantId(productType, size, framed, shirtSize, shirtColor),
          quantity: amount,
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


module.exports = { pf, order }


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