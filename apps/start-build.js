var program = require('commander')
var buildServer = require('binder-build')

program
  .version('0.0.1')
  .command('*')
  .option('-r, --registry [registry]', 'Docker registry to push images to (will be prepended to name)')
  .option('-d, --directory [dir]', 'Directory for storing built apps')
  .option('-a, --apiKey [key]', 'API key for authorizing administrative requests')
  .action(function (options) {
    console.log('Starting build server...')
    buildServer.start(options)
  })

program.parse(process.argv)

