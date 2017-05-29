const getConfig = (env) => {
  switch (env) {
    case 'production':
      return require('./production.js')
    default:
    case 'development': 
      return require('./development.js')
  }
}

module.exports = getConfig(process.env.NODE_ENV)