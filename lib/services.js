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

var startServices = function (config, cb) {
  console.log('Starting binder-control services...')
  var servicesDir = path.join(__dirname, '../services')
  fs.readdir(servicesDir, function (err, services) {
    if (err) return cb(err)
    async.eachSeries(services, function (service, next) {
      var servicePath = path.join(servicesDir, service, 'service.js')
      var start = require(servicePath)
      console.log('Starting service: {0}'.format(service))
      function finished (err) {
        console.log('STARTED: {0}'.format(service))
        next(err)
      }
      start(config, finished)
    }, function (err, res) {
      if (err) return cb(err)
      return cb()
    })
  })
}

module.exports = {
  buildImages: buildImages,
  startServices: startServices
}
