var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var async = require('async')
var shell = require('shelljs')
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
      return cb()
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

var execService = function (serviceName, funcName, params, cb) {
  var servicesDir = path.join(__dirname, '../services')
  var servicePath = path.join(servicesDir, serviceName, 'service.js')
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
  func(params, finished)
}

var startServices = function (config, cb) {
  mapServices('start', config, cb)
}

var stopServices = function (config, cb) {
  mapServices('stop', config, cb)
}

var startService = function (name, config, cb) {
  execService(name, 'start', config, cb)
}

var stopService = function (name, config, cb) {
  execService(name, 'stop', config, cb)
}

module.exports = {
  buildImages: buildImages,
  startServices: startServices,
  stopServices: stopServices,
  startService: startService,
  stopService: stopService
}
