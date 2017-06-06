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

module.exports = {
  resize
}