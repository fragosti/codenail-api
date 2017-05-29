const respond = (callback, body = {}, statusCode = 200) => {
  const response = {
    statusCode, 
    body: JSON.stringify(body)
  }
  callback(null, response)
}
module.exports.respond = respond
module.exports.respondWarning = (callback, warning) => respond(callback, warning, 400)
module.exports.respondError = (callback, error) => respond(callback, error, 500)