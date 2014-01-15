{$wait} = require '../fibers-utils'

#=====================================================================

# Signs a user in with its email/password.
exports.signInWithPassword = (session, req) ->
  {email, password} = req.params
  @throw 'INVALID_PARAMS' unless email? and password?

  @throw 'ALREADY_AUTHENTICATED' if session.has 'user_id'

  # Gets the user.
  user = $wait @xo.users.first {email: email}

  # Invalid credentials if the user does not exists or if the password
  # does not check.
  @throw 'INVALID_CREDENTIAL' unless user and user.checkPassword password

  # Stores the user identifier in the session.
  session.set 'user_id', user.get 'id'

  # Returns the user.
  @getUserPublicProperties user

# Signs a user in with a token.
exports.signInWithToken = (session, req) ->
  {token} = req.params
  @throw 'INVALID_PARAMS' unless token?

  @throw 'ALREADY_AUTHENTICATED' if session.has('user_id')

  # Gets the token.
  token = $wait @xo.tokens.first token
  @throw 'INVALID_CREDENTIAL' unless token?

  # Stores the user and the token identifiers in the session.
  user_id = token.get('user_id')
  session.set 'token_id', token.get('id')
  session.set 'user_id', user_id

  # Returns the user.
  user = $wait @xo.users.first user_id
  @getUserPublicProperties user

# Gets the the currently signed in user.
exports.getUser = (session) ->
  id = session.get 'user_id'

  # If the user is not signed in, returns null.
  return null unless id?

  # Returns the user.
  user = $wait @xo.users.first id
  @getUserPublicProperties user
