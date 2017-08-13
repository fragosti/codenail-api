const Promise = require('bluebird');
const gm = require('gm').subClass({imageMagick: true});

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

const takeScreenShot = (options) => {

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
  zoomForSize
}