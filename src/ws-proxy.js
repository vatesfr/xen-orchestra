import createDebug from 'debug'
import WebSocket from 'ws'

const debug = createDebug('xo:wsProxy')

const defaults = {
  // Automatically close the client connection when the remote close.
  autoClose: true
}

// Proxy a WebSocket `client` to a remote server which has `url` as
// address.
export default function wsProxy (client, url, opts) {
  opts = {
    ...defaults,
    protocol: client.protocol,
    ...opts
  }
  const autoClose = !!opts.autoClose
  delete opts.autoClose

  function onClientSend (error) {
    if (error) {
      debug('client send error', error)
    }
  }
  function onRemoteSend (error) {
    if (error) {
      debug('remote send error', error)
    }
  }

  const remote = new WebSocket(url, opts).once('open', function () {
    debug('connected to %s', url)
  }).once('close', function () {
    debug('remote closed')

    if (autoClose) {
      client.close()
    }
  }).once('error', function (error) {
    debug('remote error: %s', error)
  }).on('message', function (message) {
    client.send(message, onClientSend)
  })

  client.once('close', function () {
    debug('client closed')
    remote.close()
  }).on('message', function (message) {
    remote.send(message, onRemoteSend)
  })
}
