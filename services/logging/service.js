var path = require('path')

var _ = require('lodash')
var async = require('async')
var urljoin = require('url-join')
var request = require('request')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var getLogger = require('binder-logging').getLogger
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
    'LOGSTASH_CONFIG_DIR': 'logging.logstash.configDir',
    'WEBSOCKET_PORT': 'logging.streaming.port'
  }
  _.forEach(_.keys(confToVars), function (envVar) {
    var value = _.get(config, confToVars[envVar])
    if (!value) {
      return cb(new Error('malformed configuration file: {} not specified'.format(envVar)))
    }
    confToVars[envVar] = value
  })

  var dcPath = path.join(__dirname, '../../services', 'logging', 'docker-compose.yml')
  var startContainers = function (next) {
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
      // give the containers 10s to start up
      console.log('Waiting for logging containers to start up...')
      setTimeout(function () {
        return next(err)
      }, 15000)
    })
  }

  // TODO: update the elasticsearch mapping in a less hack-y way
  // log a single message so that the mappings for dynamically-generated fields are created
  var logFirstMessage = function (next) {
    var logger = getLogger()
    logger.error('this is a test message', { app: 'test-app' })
    // give the log message 2 seconds to propage through elasticsearch
    setTimeout(function () {
      return next(null)
    }, 5000)
  }

  // update the mapping for the app field, then recreate the index
  var configureElasticsearch = function (next) {
    var esUrl = 'http://localhost:' + confToVars['ELASTICSEARCH_PORT']
    var indexUrl = urljoin(esUrl, 'binder-logs')
    request.get({
      url: indexUrl,
      json: true
    }, function (err, json) {
      if (err) return next(err)
      // we need to be able to do exact string search on the app name
      var mappings = json.body['binder-logs']
      mappings.mappings.logs.properties.app['index'] = 'not_analyzed'
      request({
        url: indexUrl,
        method: 'DELETE'
      }, function (err, rsp) {
        if (err) return next(err)
        request({
          url: indexUrl,
          method: 'PUT',
          json: true,
          body: mappings
        }, function (err, rsp) {
          return next(err)
        })
      })
    })
  }

  async.series([
    startContainers,
    logFirstMessage,
    configureElasticsearch
  ], function (err) {
    console.log('STARTED: logging service')
    return cb(err)
  })
}

module.exports = start
