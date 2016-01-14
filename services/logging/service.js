var path = require('path')

var _ = require('lodash')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var start = function (opts) {
  var config = opts.config
  if (!config.logging) {
    console.error('malformed configuration file: no \'logging\' section')
    process.exit(1)
  }
  var confToVars = {
    'ELASTICSEARCH_PORT': 'logging.elasticsearch.port',
    'ELASTICSEARCH_DIR': 'logging.elasticsearch.dir',
    'KIBANA_PORT': 'logging.kibana.port',
    'LOGSTASH_PORT': 'logging.logstash.port',
    'LOGSTASH_CONFIG_DIR': 'logging.logstash.configDir'
  }
  var env = ''
  _.forEach(_.keys(confToVars), function (envVar) {
    var value = _.get(config, confToVars(envVar))
    if (!value) {
      console.error('malformed configuration file: {} not specified'.format(envVar))
      process.exit(1)
    }
    env += '{0}={1} '.format(envVar, confToVars(envVar))
  })
  var dcPath = path.join(__dirname, 'services', 'logging', 'docker-compose.yml')
  shell.exec('{0} docker-compose -f {1} up'.format(env, dcPath))
}

module.exports = start
