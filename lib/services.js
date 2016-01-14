var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var buildImages = function () {
  console.log('Building binder-control Docker images...')
  fs.readdir(path.join(__dirname, 'images'), function (images) {
    _.forEach(images, function (image) {
      var imagePath = path.join(__dirname, 'images', image)
      var cmd = 'docker build -t {0} {1}'.format(image, imagePath)
      console.log('Executing \'{0}\''.format(cmd))
      shell.exec(cmd)
    })
  })
}

var startServices = function () {
  console.log('Starting binder-control services...')
  fs.readdir(path.join(__dirname, 'services'), function (services) {
    _.forEach(services, function (service) {
      var servicePath = path.join(__dirname, 'services', service, 'service.js')
      var start = require(servicePath)
      console.log('Starting service: {0}'.format(service))
      start()
    })
  })
}

module.exports = {
  buildImages: buildImages,
  startServices: startServices
}
