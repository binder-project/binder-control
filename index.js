#!/usr/bin/env node
var _ = require('lodash')
var program = require('commander')
var BuildServer = require('binder-build')
var KubernetesServer = require('binder-deploy-kubernetes')

// TODO: better backend management
var backends = {
  kubernetes: {
    start: function (opts) {
    }
  }
}

program
  .version('0.0.1')

program
  .command('start-build')
  .description('Start the build server')
  .alias('build')
  .option('-r, --registry [registry]', 'Docker registry to push images to (will be prepended to name)')
  .option('-d, --directory [dir]', 'Directory for storing built apps')
  .option('-a, --apiKey [key]', 'API key for authorizing administrative requests')
  .action(function (options) {
    var registry = options.registry
    var BuildServer = require('binder-build')
    var opts = {
      registry: registry
    }
    var server = new BuildServer(opts)
    server.start()
  })

program
  .command('start-registry')
  .description('Start the registry server')
  .alias('registry')
  .option('-a, --apiKey [key]', 'API key for authorizing administrative requests')
  .action(function (options) {
    console.log('Starting registry...')
  })

program
  .command('start-deploy <backend>')
  .description('Start a deploy backend server')
  .alias('deploy')
  .option('-a, --apiKey [key]', 'API key for authorizing administrative requests')
  .action(function (backend, options) {
    var supportedBackends = _.keys(backends)
    if (backend in backends) {
      startFunc = backends[backend].start
      startFunc(options)
    } else {
      console.error('backend ' + backend + ' not supported!')
      process.exit(1)
    }
    console.log('Starting deploy with backend: ' + backend)
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
  })

program.parse(process.argv)
