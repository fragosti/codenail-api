const img = require('./image.js');

const create = (options, isPhone) => {
  const { width, height } = options
  return img.takeScreenShot(isPhone, options).then(({ filePath, fileName, previewId }) => {
    return img.upload(fileName, filePath, 'codenail-order-previews', {
      width: width*2,
      height: height*2,
    }).then(() => ({ previewId }))
  })
}

module.exports = {
  create,
}