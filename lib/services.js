var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var async = require('async')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var buildImages = function () {
  console.log('Building binder-control Docker images...')
  var imagesDir = path.join(__dirname, '../images')
  fs.readdir(imagesDir, function (err, images) {
    if (err) {
      console.error('could not read from images directory: {0}'.format(err))
      process.exit(1)
    }
    _.forEach(images, function (image) {
      var imagePath = path.join(imagesDir, image)
      var cmd = 'docker build -t {0} {1}'.format(image, imagePath)
      console.log('Executing \'{0}\''.format(cmd))
      shell.exec(cmd)
    })
  })
}

var startServices = function (config) {
  console.log('Starting binder-control services...')
  var servicesDir = path.join(__dirname, '../services')
  fs.readdir(servicesDir, function (err, services) {
    if (err) {
      console.error('could not read from services directory: {0}'.format(err))
      process.exit(1)
    }
    async.each(services, function (service, next) {
      var servicePath = path.join(servicesDir, service, 'service.js')
      var start = require(servicePath)
      console.log('Starting service: {0}'.format(service))
      start(config, next)
    }, function (err, res) {
      if (err) {
        console.error('Sould not start services: {0}'.format(err))
        process.exit(1)
      }
      console.log('Started services successfully')
    })
  })
}

module.exports = {
  buildImages: buildImages,
  startServices: startServices
}
