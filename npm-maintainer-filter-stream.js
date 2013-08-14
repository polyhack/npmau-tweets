const TransformStream  = require('stream').Transform
    , inherits         = require('util').inherits

function isMaintainer (maintainers, pkg) {
  if (!pkg || !maintainers.length)
    return false

  var v = pkg['dist-tags'] && pkg['dist-tags'].latest
    , i
  if (v && pkg.versions && pkg.versions[v] && Array.isArray(pkg.versions[v].maintainers)) {
    for (i = 0; i < pkg.versions[v].maintainers.length; i++) {
      if (pkg.versions[v].maintainers[i].name
          && maintainers.indexOf(pkg.versions[v].maintainers[i].name) > -1)
        return true
    }
  }
  return false
}

function NpmMaintainerFilterStream() {
  TransformStream.call(this, { objectMode: true })
  this._maintainers = []
}

inherits(NpmMaintainerFilterStream, TransformStream)

NpmMaintainerFilterStream.prototype._transform = function (chunk, encoding, callback) {
  if (isMaintainer(this._maintainers, chunk.doc))
    this.push(chunk)
  callback()
}

NpmMaintainerFilterStream.prototype.setMaintainers = function (maintainers) {
  this._maintainers = maintainers
}

module.exports = NpmMaintainerFilterStream
