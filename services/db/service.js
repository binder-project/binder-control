var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var shell = require('shelljs')
var jsonfile = require('jsonfile')
var format = require('string-format')
format.extend(String.prototype)

var utils = require('binder-utils')

// TODO: move to util file
var validateConfig = function (config) {
  if (!config) {
    return new Error('malformed configuration file: config undefined')
  }
  if (!config.db) {
    return new Error('malformed configuration file: no \'db\' section')
  }
  return null
}

/**
 * Start the database service (running and MongoDB instance)
 * @param {object} config - configuration options
 * @param {function} cb - cb(err)
 */
var start = function (cb) {
  var config = jsonfile.readFileSync(path.join(process.env['HOME'], '.binder/db.conf'))
  var invalid = validateConfig(config)
  if (invalid) {
    return cb(invalid)
  }
  var confToVars = {
    'MONGODB_PORT': 'port',
    'MONGODB_DIR': 'dir'
  }
  _.forEach(_.keys(confToVars), function (envVar) {
    var value = _.get(config, confToVars[envVar])
    if (!value) {
      return cb(new Error('malformed configuration file: {} not specified'.format(envVar)))
    }
    confToVars[envVar] = value
  })
  var dcPath = path.join(__dirname, '../../services', 'db', 'docker-compose.yml')
  var app = {
    name: 'binder-db-service',
    env: confToVars,
    script: shell.which('docker-compose'),
    args: ['-f', '{0}'.format(dcPath), 'up'],
    exec_interpreter: 'none'
  }
  utils.startWithPM2(app, function (err) {
    if (err) {
      console.error('error starting logging service: ' + err.msg)
    }
    return cb(err)
  })
}

module.exports = {
  start: start
}
