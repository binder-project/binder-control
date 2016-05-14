var fs = require('fs')
var os = require('os')
var path = require('path')

var _ = require('lodash')
var async = require('async')
var jsonfile = require('jsonfile')
var spawn = require('child_process').spawn 
var exec = require('child_process').exec
var request = require('request')

var utils = require('binder-utils')

const kubeVersion = 'v1.2.4'

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
 * Start the Kubernetes docker containers
 * @param {function} cb - cb(err)
 */
var start = function (cb) {
  var config = jsonfile.readFileSync(path.join(process.env['HOME'], '.binder/deploy.conf'))
  var invalid = validateConfig(config)
  if (invalid) {
    return cb(invalid)
  }
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

  var osArch = os.arch()
  if (osArch === 'x64') {
    var arch = 'amd64'
  } else if (osArch === 'ia32') {
    var arch = '386'
  }
  var platform = os.platform()

  confToVars['ARCH'] = arch
  confToVars['K8S_VERSION'] = kubeVersion
  var kubePath = path.join(__dirname, 'kubectl')

  var launchContainers = function (next) {
    var kubeCmd = spawn(path.join(__dirname, 'start-kubernetes.sh'), {
      env: _.merge(process.env, confToVars),
      stdio: 'inherit',
      shell: true,
      uid: process.getuid()
    })
    kubeCmd.on('exit', function (code) {
      if (code !== 0) {
        return next(new Error('Launching containers failed with code: ' + code))
      }
      return next(null)
    })
  }

  var setupKubectl = function (next) {
    var kubeUrl = 'http://storage.googleapis.com/kubernetes-release/release/' + kubeVersion +
                  '/bin/' + platform + '/' + arch + '/kubectl'
    var stream = request(kubeUrl).pipe(fs.createWriteStream(kubePath))
    stream.on('end', function (err) {
      if (err) return next(err)
      fs.chmod(kubePath, 775, function (err) {
        if (err) return next(err)
        if (platform === 'darwin') {
          var machine = require('dockermachine')
          machine.active(function (err, active) {
            if (err) return next(err)
            exec('docker-machine ssh ' + active + ' -N -L 8080:localhost:8080', function (err) {
              return next(err)
            })
          })
        } else {
          return next(err)
        }
      })
    })
  }

  var launchProxy = function (next) {
    utils.startWithPM2({
      name: 'binder-kube-cluster-proxy',
      env: confToVars,
      script: kubePath,
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
  }

  async.series([
    launchContainers,
    setupKubectl,
    launchProxy
  ], function (err) {
    return cb(err)
  })
}

/**
 * Stop the Kubernetes VM
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
