{$wait} = require '../fibers-utils'

#=====================================================================

# Creates a new token.
#
# TODO: Token permission.
exports.create = ->
  userId = @session.get 'user_id'

  # The user MUST be signed in and not with a token
  @throw 'UNAUTHORIZED' if not userId? or @session.has 'token_id'

  # Creates the token.
  token = $wait @xo.tokens.generate userId

  # Returns its identifier.
  token.id

# Deletes a token.
exports.delete = ->
  {token: tokenId} = @getParams {
    token: { type: 'string' }
  }

  # Gets the token.
  token = $wait @xo.tokens.first tokenId
  @throw 'NO_SUCH_OBJECT' unless token?

  # Deletes the token.
  $wait @xo.tokens.remove tokenId

  # Returns true.
  true
