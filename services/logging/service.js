var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var jsonfile = require('jsonfile')
var async = require('async')
var urljoin = require('url-join')
var request = require('request')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var getLogger = require('binder-logging').getLogger
var utils = require('binder-utils')

// TODO: move to util file
var validateConfig = function (config) {
  if (!config) {
    return new Error('malformed configuration file: config undefined')
  }
  return null
}

/**
 * Start the logging service (running the ELK stack)
 * @param {function} cb - cb(err)
 */
var start = function (cb) {
  var config = jsonfile.readFileSync(path.join(process.env['HOME'], '.binder/logging.conf'))
  var invalid = validateConfig(config)
  if (invalid) {
    return cb(invalid)
  }
  var confToVars = {
    'ELASTICSEARCH_PORT': 'elasticsearch.port',
    'ELASTICSEARCH_DIR': 'elasticsearch.dir',
    'KIBANA_PORT': 'kibana.port',
    'LOGSTASH_PORT': 'logstash.port',
    'LOGSTASH_CONFIG_DIR': 'logstash.configDir',
    'WEBSOCKET_PORT': 'streaming.port'
  }
  _.forEach(_.keys(confToVars), function (envVar) {
    var value = _.get(config, confToVars[envVar])
    if (!value) {
      return cb(new Error('malformed configuration file: {} not specified'.format(envVar)))
    }
    confToVars[envVar] = value
  })

  // if the configDir does not exist (no existing infrastucture), set it to the service's
  // default configuration
  try {
    fs.statSync(confToVars['LOGSTASH_CONFIG_DIR'])
  } catch (err) {
    confToVars['LOGSTASH_CONFIG_DIR'] = path.join(__dirname, 'logstash')
  }

  var dcPath = path.join(__dirname, '../../services', 'logging', 'docker-compose.yml')
  var startContainers = function (next) {
    utils.startWithPM2({
      name: 'binder-logging-service',
      env: confToVars,
      script: shell.which('docker-compose'),
      args: ['-f', dcPath, 'up'],
      exec_interpreter: 'none'
    }, function (err) {
      if (err) {
        console.error('error starting logging service: ' + err.msg)
      }
      // give the containers 1m to start up
      console.log('Waiting 2 minutes for logging containers to start up...')
      setTimeout(function () {
        return next(err)
      }, 2 * 60 * 1000)
    })
  }

  // TODO: update the elasticsearch mapping in a less hack-y way
  // log a single message so that the mappings for dynamically-generated fields are created
  var logFirstMessage = function (next) {
    var logger = getLogger('logging-service', config.logging)
    try {
      logger.error('this is a test message', { app: 'test-app' })
    } catch (err) {
      console.error('Could not generate the test error message -- logging server not responding')
    }
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
      var indexPath = 'mappings.logs.properties.app.index'
      // do not recreate the index unless necessary (only the first time Binder is initialized)
      if (_.get(mappings, indexPath) === 'not_analyzed') {
        return next(null)
      }
      _.set(mappings, indexPath, 'not_analyzed')
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
    return cb(err)
  })
}

module.exports = {
  start: start
}
