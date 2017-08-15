const Promise = require('bluebird');
const gm = require('gm').subClass({imageMagick: true});
const share = require('./share.js');
const shortid = require('shortid');
const webshot = Promise.promisify(require('webshot'));
const config = require('../config');
const s3 = require('../lib/s3.js');
const fs = require('../lib/fs.js');


const resize = (imgPath, height, width) => {
  return new Promise((resolve, reject) => {
    gm(imgPath).resize(height, width).toBuffer('PNG', (error, buffer) => {
      if (error) {
        reject(error)
      }
      resolve(buffer)
    })
  })
}

const takeScreenShot = (isPhone, options, id) => {
  const previewId = id || shortid.generate()
  return share.create(previewId, options).then(() => {
    const fileName = `${previewId}.png`
    const filePath = `/tmp/${fileName}`
    const { width, height, size } = options
    let zoomFactor = zoomForSize(size)
    if (isPhone) {
      zoomFactor *= 2
    }
    const margin = 6
    const yMargin = (height/width)*margin
    return webshot(`${config.SITE_ADDR}/render/${previewId}?margin=${margin}`, filePath, {
      windowSize: { 
        width: (width + margin*2)*zoomFactor,
        height: (height + yMargin*2)*zoomFactor,
      },
      phantomPath: config.PHANTOM_PATH,
      takeShotOnCallback: true,
      zoomFactor,
    }).then(() => ({
      previewId,
      filePath,
      fileName
    }))
  })
}

const upload = (fileName, filePath, bucket, newDims) => {
  let imgPromise = null
  if (newDims) {
    const { width, height } = newDims
    imgPromise = resize(filePath, Math.round(width), Math.round(height))
  } else {
    imgPromise = fs.readFileAsync(filePath)
  }
  return imgPromise.then((body) => {
    return s3.putObjectAsync({
      Bucket: bucket,
      Key: fileName,
      Body: body,
      ContentType: 'image/png',
    })
  })
}

const zoomForSize = (size) => {
  const splitSize = size.split('x')
  const maxDim = Math.max(parseInt(splitSize[0], 10), parseInt(splitSize[1], 10))
  switch(maxDim) {
    case 36:
      return 7
    case 24:
    case 20:
      return 5
    case 12:
    case 10: 
      return 3
    default:
      return 4
  }
}

module.exports = {
  resize,
  zoomForSize,
  takeScreenShot,
  upload,
}