var path = require('path')

var _ = require('lodash')
var jsonfile = require('jsonfile')
var shell = require('shelljs')
var prompt = require('prompt')
var colors = require('colors/safe')
var spawn = require('child_process').spawnSync

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

var presentPrompt = function (cb) {
  prompt.start()
  prompt.get({
    properties: {
      minions: {
        description: 'How many minion nodes would you like in your cluster?',
        type: 'integer',
        default: 1
      },
      provider: {
        description: 'What cloud provider would you like to use?',
        type: 'string',
        default: 'gce'
      }
    }
  }, function (err, results) {
    if (err) return cb(err)
    return cb(null, results)
  })
}

/**
 * Start the Kubernetes cluster
 * @param {function} cb - cb(err)
 */
var start = function (cb) {
  var config = jsonfile.readFileSync(path.join(process.env['HOME'], '.binder/deploy.conf'))
  var invalid = validateConfig(config)
  if (invalid) {
    return cb(invalid)
  }
  presentPrompt(function (err, results) {
    if (err) return cb(err)
    var confToVars = {
      'API_SERVER_PORT': 'kube.port',
    }
    _.forEach(_.keys(confToVars), function (envVar) {
      var value = _.get(config, confToVars[envVar])
      if (!value) {
        return cb(new Error('malformed configuration file: {} not specified'.format(envVar)))
      }
      confToVars[envVar] = value
    })
    confToVars['SERVICE_DIR'] = __dirname
    confToVars['NODE_DISK_SIZE'] = '100GB'
    confToVars['KUBE_ADMISSION_CONTROL'] = 'NamespaceLifecycle,LimitRanger,ResourceQuota'
    confToVars['NUM_NODES'] = results.minions
    confToVars['KUBERNETES_PROVIDER'] = results.provider

    var clusterResult = spawn(path.join(__dirname, 'start-kubernetes.sh'), {
      env: _.merge(process.env, confToVars),
      stdio: 'inherit',
      shell: true,
      uid: process.getuid()
    })

    utils.startWithPM2({
      name: 'binder-kube-cluster-proxy',
      env: confToVars,
      script: path.join(__dirname, 'kubernetes/cluster/kubectl.sh'),
      args: ['proxy', '--port={0}'.format(confToVars['API_SERVER_PORT'])],
      exec_interpreter: 'none'
    }, function (err) {
      if (clusterResult.error) {
        return cb(new Error('error starting kubernetes cluster: ' + result.error))
      }
      if (err) {
        return cb(new Error('error starting kubernetes cluster: ' + err))
      }
      return cb(null)
    })
  })
}

/**
 * Stop the Kubernetes cluster
 * @param {function} cb - cb(err)
 */
var stop = function (cb) {
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
