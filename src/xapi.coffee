# URL parsing.
{parse: $parseUrl} = require 'url'

#---------------------------------------------------------------------

$xmlrpc = require 'xmlrpc'

#---------------------------------------------------------------------

# Helpers for dealing with fibers.
{$wait} = require './fibers-utils'

#=====================================================================

$sleep = (delay) ->
  (cb) -> setTimeout cb, delay

#=====================================================================

# Note: All methods are synchronous (using fibers).
class $XAPI
  # Number of tries when the connection fails (TCP or XAPI).
  tries: 10

  constructor: ({@host, @username, @password}) ->
    @connect()

  connect: (force = false) ->
    {hostname, port} = $parseUrl "http://#{@host}"

    # Returns nothing if already connected to this host and not force.
    if !force and (hostname is @xmlrpc?.options.host)
      return

    @xmlrpc = $xmlrpc.createSecureClient {
      host: hostname
      port: port ? 443
      rejectUnauthorized: false
      timeout: 10
    }

    # Logs in.
    @logIn()

  call: (method, args...) ->
    @connect() unless @xmlrpc

    tries = @tries
    do helper = =>
      try
        result = $wait (callback) =>
          actualArgs = if @sessionId
            [@sessionId, args...]
          else
            args

          @xmlrpc.methodCall method, actualArgs, callback

        # Returns the plain result if it does not have a valid XAPI format.
        return result unless result.Status?

        # Returns the result's value if all went well.
        return result.Value if result.Status is 'Success'

        # Something went wrong.
        error = result.ErrorDescription or value
      catch error # Captures the error if it was thrown.

      # If it failed too much times, just stops.
      throw error unless --tries

      # Gets the error code for transport errors and XAPI errors.
      code = error.code or error[0]

      switch code

        # XAPI sometimes close the connection when the server is no
        # longer pool master (`event.next`), so we have to retry at
        # least once to know who is the new pool master.
        when 'ECONNRESET', \
             'ECONNREFUSED', \
             'EHOSTUNREACH', \
             'HOST_STILL_BOOTING', \
             'HOST_HAS_NO_MANAGEMENT_IP'
          # Node.js seems to reuse the broken socket, so we add a small
          # delay.
          #
          # FIXME Magic number!!!
          #
          # I would like to be able to use a shorter delay but for
          # some reason, when we connect to XAPI at a given moment,
          # the connection hangs.
          $wait $sleep 5e3
          helper()

        # XAPI is sometimes reinitialized and sessions are lost.
        # We try log in again if necessary.
        when 'SESSION_INVALID'
          @logIn()
          helper()

        # Except during the login process, catch this error and try to
        # log in again.
        when 'SESSION_AUTHENTICATION_FAILED'
          throw error unless @sessionId

          @logIn()
          helper()

        # If the current host is a slave, changes the current host,
        # reconnect and retry.
        when 'HOST_IS_SLAVE'
          @host = error[1]
          @connect()
          helper()

        # This error has not been handled, just forwards it.
        else
          throw error

  logIn: ->
    # Makes sure there is not session id left.
    delete @sessionId

    @sessionId = @call 'session.login_with_password', @username, @password

#=====================================================================

module.exports = $XAPI
