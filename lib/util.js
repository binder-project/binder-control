var pm2 = require('pm2')

function startWithPM2 (conf) {
  pm2.connect(function (err) {
    if (err) {
      console.error(err)
      process.exit(2)
    }
    pm2.start(conf, function (err, apps) {
      if (err) { 
        console.log(err)
        process.exit(2)
      }
      pm2.disconnect()
    })
  })
}

module.exports = {
  startWithPM2: startWithPM2
}

