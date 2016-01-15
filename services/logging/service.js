var path = require('path')

var _ = require('lodash')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var util = require('../../lib/util.js')

// TODO: move to util file
var validateConfig = function (config) {
  if (!config) {
    return new Error('malformed configuration file: config undefined')
  }
  if (!config.logging) {
    return new Error('malformed configuration file: no \'logging\' section')
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
    'ELASTICSEARCH_PORT': 'logging.elasticsearch.port',
    'ELASTICSEARCH_DIR': 'logging.elasticsearch.dir',
    'KIBANA_PORT': 'logging.kibana.port',
    'LOGSTASH_PORT': 'logging.logstash.port',
    'LOGSTASH_CONFIG_DIR': 'logging.logstash.configDir'
  }
  _.forEach(_.keys(confToVars), function (envVar) {
    var value = _.get(config, confToVars[envVar])
    if (!value) {
      return cb(new Error('malformed configuration file: {} not specified'.format(envVar)))
    }
    confToVars[envVar] = value
  })
  var dcPath = path.join(__dirname, '../../services', 'logging', 'docker-compose.yml')
  util.startWithPM2({
    name: 'binder-logging-service',
    env: confToVars,
    script: shell.which('docker-compose'),
    args: ['-f', dcPath, 'up'],
    exec_interpreter: 'none'
  }, function (err) {
    if (err) {
      console.error('error starting logging service: ' + err.msg)
    }
    return cb(err)
  })
}

module.exports = start
