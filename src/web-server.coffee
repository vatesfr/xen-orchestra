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
{$synchronize} = require './fibers-utils'

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
    @_notYetListening = 0

  close: ->
    server.close() for server in @_servers

    # Does not return anything.
    undefined

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
      host ?= '0.0.0.0'
      server.listen port, host

    ++@_notYetListening

    errorHandler = (error) ->
      # `address()` can only be used once listening.
      address = if socket?
        socket
      else
        "#{host}:#{port}"

      # Prints a (hopefully) helpful message if the server could not
      # listen.
      console.log "[WARN] WebServer could not listen on #{address}"
      switch error.code
        when 'EACCES'
          console.log '       Access denied.'
          if port < 1024
            console.log '       Ports < 1024 are often reserved to privileges users.'
        when 'EADDRINUSE'
          console.log '       Address already in use.'

      # This server will never start listening.
      --@_notYetListening

    # Registers the error handler.
    server.on 'error', errorHandler

    server.once 'listening', =>
      # Removes the error handler.
      server.removeListener 'error', errorHandler

      # Prints a helpful message.
      address = server.address()
      if $_.isObject address
        {address, port} = address
        address = "#{address}:#{port}"
      console.log "WebServer listening on #{address}"

      # If the web server is listening on all addresses, fire the
      # `listening` event.
      @emit 'listening' unless --@_notYetListening

      # Forwards events to this object.
      $_.each $events, (event) =>
        server.on event, (args...) => @emit event, args...

    # Does not return anything.
    undefined

#=====================================================================

module.exports = $WebServer
