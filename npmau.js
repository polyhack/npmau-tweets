const NTwitter         = require('ntwitter')
    , npmMaintainers   = require('npm-maintainers-au')
    , NpmPublishStream = require('npm-publish-stream')
    , NpmMaintainerFilterStream = require('./npm-maintainer-filter-stream')
    , maintainerFilterStream    = new NpmMaintainerFilterStream()
    , secrets          = require('./secrets')
    , twit             = new NTwitter(secrets.ntwitter)

var started = false

function tweet (status, cb) {
  console.log(status.length, status)
  // twit.updateStatus() uses the wrong URL, needs trailling slash, so do it manually
  twit.post(
      '/statuses/update.json/'
    , { status: status, include_entities: 1 }
    , null
    , cb || function (err) {
        if (err)
          console.error(err)
      }
  )
}

function handleNpmData (data) {
  var pkg = data.id + '@' + data.doc['dist-tags'].latest
    , url = 'http://npm.im/' + data.id
    , maint = '('
        + data.doc.versions[data.doc['dist-tags'].latest].maintainers
            .map(function (m) { return m.name }).join(', ')
        + ')'
    , len = pkg.length + 1 + 22 /* t.co */ + 1 + maint.length + 1
    , desc = (data.doc.description || '')

  if (len + desc.length > 140)
    desc = desc.substring(0, 140 - len - 1) + '…'

  tweet(pkg + ' ' + url + ' ' + desc + ' ' + maint)
}

function updateMaintainers () {
  npmMaintainers(function (err, data) {
    if (err)
      return console.log(err)

    if (data.length) {
      maintainerFilterStream.setMaintainers(
        data.map(function (u) { return u.npmLogin })
      )
      start()
    }
  })
}

twit.verifyCredentials(function (err, data) {
  if (err) {
    console.error('COULD NOT VERIFY TWITTER CREDENTIALS', err)
    return process.exit(-1)
  }
  console.log('Verified Twitter credentials:', JSON.stringify(data))
})

function start () {
  if (started)
    return

  started = true
  NpmPublishStream({ startTime: new Date(Date.now() - 1000 * 60 * 60 * 6)})
    .on('error', console.error)
    .pipe(maintainerFilterStream)
    .on('data', handleNpmData)
}

setInterval(updateMaintainers, 1000 * 60 * 60 * 12)
updateMaintainers()