#!/usr/bin/env node
var _ = require('lodash')
var async = require('async')
var path = require('path')
var fs = require('fs')
var program = require('commander')
var shell = require('shelljs')
var format = require('string-format')
format.extend(String.prototype)

var services = require('../lib/services.js')

program
  .version('0.0.1')

program
  .command('build')
  .command('registry')
  .command('deploy-kubernetes')

program
  .command('build-images')
  .description('Build all Binder images required during the boostrapping process')
  .action(function () {
    services.buildImages()
  })

program
  .command('init')
  .option('-c, --config <path>', 'set config path. defaults to ../conf/example.json')
  .description('Start binder-db and binder-logging services')
  .action(function (options) {
    var configFile = options.config || path.join(__dirname, 'conf/example.json')
    fs.readFile(configFile, function (err, contents) {
      if (err) {
        console.error('could not read config file: {0}'.format(err))
        process.exit(2)
      }
      var initConfig = JSON.parse(contents)
      services.buildImages(function (err) {
        console.log('err: ' + err)
        if (err) {
          console.error(err)
          return
        }
        services.startServices(initConfig, function (err) {
          if (err) {
            console.error(err)
            return
          }
          console.log('Finished building images and starting services.')
          return
        })
      })
    })
  })

program
  .command('status')
  .description('Show information about all running Binder servers/services')
  .action(function () {
    console.log('Running Binder servers:')
    shell.exec('pm2 list')
  })

program
  .command('list-backends')
  .alias('backends')
  .description('List all available deployment backends')
  .action(function () {
    console.log('Available backends:')
    _.forEach(_.keys(backends), function (backend) {
      console.log(' - ' + backend)
    })
  })

program
  .command('start-all')
  .alias('all')
  .option('-f, --config-file [conf]', 'Launch all servers using their default config files')
  .action(function (options) {
    console.error('start-all is not yet implemented')
  })

program
  .command('stop-all')
  .description('Stop all Binder servers/services')
  .action(function () {
    shell.exec('pm2 delete all')
  })

program.parse(process.argv)
