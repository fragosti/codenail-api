const DEBUG_MODE = true

const noop = () => {}

module.exports.debug = DEBUG_MODE ? console.log : noop