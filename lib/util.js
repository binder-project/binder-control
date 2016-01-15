var pm2 = require('pm2')

/**
 * Start a subprocess using the PM2 process manager
 * @param {object} conf - PM2-format process specification
 * @param {function} cb - callback(err)
 */
function startWithPM2 (conf, cb) {
  console.log('calling connect...')
  pm2.connect(function (err) {
    if (err) {
      return cb(err)
    }
    pm2.start(conf, function (err, apps) {
      console.log('in start callback...')
      if (err) {
        return cb(err)
      }
      pm2.disconnect()
      console.log('startWithPM2: finishing successfully')
      return cb(null)
    })
  })
}

module.exports = {
  startWithPM2: startWithPM2
}

