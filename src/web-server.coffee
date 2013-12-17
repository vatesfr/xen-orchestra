# Events handling.
{EventEmitter: $EventEmitter} = require 'events'

# File handling.
$fs = require 'fs'

# HTTP(S) handling.
$http = require 'http'
$https = require 'https'

#---------------------------------------------------------------------

# Low level tools.
$_ = require 'underscore'

#---------------------------------------------------------------------

# Helpers for dealing with fibers.
{$sleep, $synchronize} = require './fibers-utils'

#=====================================================================

# Events which may be emitted by a `http(s).Server`
$events = [
  'checkContinue'
  'clientError'
  'close'
  'connect'
  'connection'
  'error'
  'request'
  'upgrade'
]

$readFile = $synchronize 'readFile', $fs

#=====================================================================

# HTTP/HTTPS server which can listen on multiple address/ports or
# sockets.
class $WebServer extends $EventEmitter

  constructor: ->
    @_servers = []

  close: ->
    server.close() for server in @_servers

    # Does not return anything.

  listen: ({host, port, socket, certificate, key}) ->
    server = if certificate? and key?
      $https.createServer {
        cert: $readFile certificate
        key: $readFile key
      }
    else
      $http.createServer()
    @_servers.push server

    # Makes it start listening.
    if socket?
      server.listen socket
    else
      server.listen port, host

    # Helpful message.
    server.once 'listening', ->
      address = server.address()
      if $_.isObject address
        {address, port} = address
        address = "#{address}:#{port}"

      console.log "WebServer listening on #{address}"

    # Forwards events to this object.
    $_.each $events, (event) =>
      server.on event, (args...) => @emit event, args...

    # Does not return anything.
    undefined

#=====================================================================

module.exports = $WebServer
