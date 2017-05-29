const getConfig = (env) => {
  switch (env) {
    default: // on prod it will be undefined
    case 'production':
      return require('./production.js')
    case 'development': 
      return require('./development.js')
  }
}
const config = getConfig(process.env.NODE_ENV)
console.log(config)
module.exports = config
