{$wait} = require '../fibers-utils'

#=====================================================================

# Signs a user in with its email/password.
exports.signInWithPassword = ({email, password}) ->
  @throw 'ALREADY_AUTHENTICATED' if @session.has 'user_id'

  # Gets the user.
  user = $wait @users.first {email}

  # Invalid credentials if the user does not exists or if the password
  # does not check.
  @throw 'INVALID_CREDENTIAL' unless user and $wait user.checkPassword password

  # Stores the user identifier in the session.
  @session.set 'user_id', user.get 'id'

  # Returns the user.
  return @getUserPublicProperties user
exports.signInWithPassword.params = {
  email: { type: 'string' }
  password: { type: 'string' }
}

# Signs a user in with a token.
exports.signInWithToken = ({token}) ->
  @throw 'ALREADY_AUTHENTICATED' if @session.has 'user_id'

  # Gets the token.
  token = $wait @tokens.first token
  @throw 'INVALID_CREDENTIAL' unless token?

  # Stores the user and the token identifiers in the session.
  user_id = token.get('user_id')
  @session.set 'token_id', token.get 'id'
  @session.set 'user_id', user_id

  # Returns the user.
  user = $wait @users.first user_id
  return @getUserPublicProperties user
exports.signInWithToken.params = {
  token: { type: 'string' }
}

exports.signOut = ->
  @session.unset 'token_id'
  @session.unset 'user_id'

  return true

# Gets the the currently signed in user.
exports.getUser = ->
  id = @session.get 'user_id', null

  # If the user is not signed in, returns null.
  return null unless id?

  # Returns the user.
  user = $wait @users.first id
  return @getUserPublicProperties user
