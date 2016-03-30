var path = require('path')

var _ = require('lodash')
var shell = require('shelljs')

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
 * Start the Kubernetes service (running inside a VirtualBox VM)
 * @param {object} config - configuration options
 * @param {function} cb - cb(err)
 */
var start = function (config, cb) {
  var invalid = validateConfig(config)
  if (invalid) {
    return cb(invalid)
  }
  var confToVars = {
    'API_SERVER_PORT': 'kubernetes.port',
    'KUBE_PROXY_PORT': 'kubernetes.proxyPort'
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

/**
 * Stop the Kubernetes VM
 */
var stop = function (config, cb) {
  var cmd = 'stop-kubernetes.sh'
  shell.env['SERVICE_DIR'] = __dirname
  shell.exec(path.join(__dirname, cmd), function (err) {
    return cb(err)
  })
}

module.exports = {
  start: start,
  stop: stop
}
