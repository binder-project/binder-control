var path = require('path')

var _ = require('lodash')
var async = require('async')
var urljoin = require('url-join')
var request = require('request')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var utils = require('binder-utils')

// TODO: move to util file
var validateConfig = function (config) {
  if (!config) {
    return new Error('malformed configuration file: config undefined')
  }
  if (!config.logging) {
    return new Error('malformed configuration file: no \'kubernetes\' section')
  }
  return null
}

/**
 * Start the logging service (running the ELK stack)
 * @param {object} config - configuration options
 * @param {function} cb - cb(err)
 */
var start = function (config, cb) {
  var invalid = validateConfig(config)
  if (invalid) {
    return cb(invalid)
  }
  var confToVars = {
    'API_SERVER_PORT': 'kubernetes.port'
  }
  _.forEach(_.keys(confToVars), function (envVar) {
    var value = _.get(config, confToVars[envVar])
    if (!value) {
      return cb(new Error('malformed configuration file: {} not specified'.format(envVar)))
    }
    confToVars[envVar] = value
  })
  confToVars['SERVICE_DIR'] = __dirname
  utils.startWithPM2({
    name: 'binder-kubernetes-service',
    env: confToVars,
    script: path.join(__dirname, 'start-kubernetes.sh'),
    exec_interpreter: 'bash'
  }, function (err) {
    if (err) {
      console.error('error starting kubernetes service: ' + err.msg)
    }
    return cb(err)
  })
}

module.exports = start
