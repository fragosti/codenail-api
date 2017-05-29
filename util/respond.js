const respond = (callback, body = {}, statusCode = 200) => {
  const response = {
    statusCode, 
    headers: {
      'Access-Control-Allow-Origin' : '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials' : true // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(body)
  }
  callback(null, response)
}
module.exports.respond = respond
module.exports.respondWarning = (callback, warning) => respond(callback, warning, 400)
module.exports.respondError = (callback, error) => respond(callback, error, 500)