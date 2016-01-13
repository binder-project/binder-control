var program = require('commander')
var shell = require('shelljs')

program
  .version('0.0.1')
  .command('*')
  .option('-a, --apiKey [key]', 'API key for authorizing administrative requests')
  .action(function (options) {
    console.log('Starting registry server...')
    if (shell.exec('docker').code === 127) {
      console.error('cannot launch binder-registry -- docker must be installed')
      process.exit(1)
    }
    shell.exec('docker run -e BINDER_API_KEY=' + options.apiKey + 'binder/registry')
  })

program.parse(process.argv)

