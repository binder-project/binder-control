var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var async = require('async')
var shell = require('shelljs')
var jsonfile = require('jsonfile')
var format = require('string-format')
format.extend(String.prototype)

var buildImages = function (cb) {
  console.log('Building binder-control Docker images...')
  var imagesDir = path.join(__dirname, '../images')
  fs.readdir(imagesDir, function (err, images) {
    if (err) return cb(err)
    _.forEach(images, function (image) {
      var imagePath = path.join(imagesDir, image)
      var cmd = 'docker build -t {0} {1}'.format(image, imagePath)
      console.log('Executing \'{0}\''.format(cmd))
      shell.exec(cmd)
      if (cb) {
        return cb()
      }
    })
  })
}

var mapServices = function (funcName, params, cb) {
  console.log('Calling \'{0}\' on all binder-control services...'.format(funcName))
  var servicesDir = path.join(__dirname, '../services')
  fs.readdir(servicesDir, function (err, services) {
    if (err) return cb(err)
    async.eachSeries(services, function (service, next) {
      execService(service, funcName, params, next)
    }, function (err, res) {
      if (err) return cb(err)
      return cb()
    })
  })
}

var execService = function (serviceName, funcName, cb) {
  var servicesDir = path.join(__dirname, '../services')
  var servicePath = path.join(servicesDir, serviceName, 'service.js')
  var confFile = path.join(process.env['HOME'], '.binder', serviceName + '.conf')
  var config = jsonfile.readFileSync(confFile)
  fs.exists(servicePath, function (exists) {
    if (!exists) {
      return cb(new Error('Cannot find service: ' + serviceName))
    }
    var func = require(servicePath)[funcName]
    console.log('Starting \'{0}\' - {1}'.format(funcName, serviceName))
    function finished (err) {
      console.log('Finished \'{0}\' - {1}'.format(funcName, serviceName))
      return cb(err)
    }
    if (!func) {
      // if the function does not exist, do not throw an error
      return cb()
    }
    func(config, finished)
  })
}

var startServices = function (cb) {
  mapServices('start', cb)
}

var stopServices = function (cb) {
  mapServices('stop', cb)
}

var startService = function (name, cb) {
  execService(name, 'start', cb)
}

var stopService = function (name, cb) {
  execService(name, 'stop', cb)
}

module.exports = {
  buildImages: buildImages,
  startServices: startServices,
  stopServices: stopServices,
  startService: startService,
  stopService: stopService
}
