const core = require('@stae/babel-node')

module.exports = {
  ...core,
  env: {
    ...core.env,
    testing: {
      ...core.env?.testing,
      plugins: [ 'istanbul' ]
    }
  }
}
