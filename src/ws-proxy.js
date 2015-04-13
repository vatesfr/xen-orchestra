import assign from 'lodash.assign'
import debug from 'debug'
import WebSocket from 'ws'

debug = debug('xo:wsProxy')

const defaults = {
  // Automatically close the client connection when the remote close.
  autoClose: true,

  // Reject secure connections to unauthorized remotes (bad CA).
  rejectUnauthorized: false
}

// Proxy a WebSocket `client` to a remote server which has `url` as
// address.
export default function wsProxy (client, url, opts) {
  opts = assign({}, defaults, opts)

  const remote = new WebSocket(url, {
    protocol: opts.protocol || client.protocol,
    rejectUnauthorized: opts.rejectUnauthorized
  }).once('open', function () {
    debug('connected to', url)
  }).once('close', function () {
    debug('remote closed')

    if (opts.autoClose) {
      client.close()
    }
  }).once('error', function (error) {
    debug('remote error', error)
  }).on('message', function (message) {
    client.send(message, function (error) {
      if (error) {
        debug('client send error', error)
      }
    })
  })

  client.once('close', function () {
    debug('client closed')
    remote.close()
  }).on('message', function (message) {
    remote.send(message, function (error) {
      if (error) {
        debug('remote send error', error)
      }
    })
  })
}
