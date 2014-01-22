{$wait} = require '../fibers-utils'

#=====================================================================

# Creates a new user.
exports.create = ->
  {email, password, permission} = @getParams {
    email: { type: 'string' }
    password: { type: 'string' }
    permission: { type: 'string', optional: true}
  }
  @throw 'INVALID_PARAMS' unless email? and password?

  # Current user must be administrator.
  @checkPermission 'admin'

  # Creates the user.
  user = $wait @users.create email, password, permission

  # Returns the identifier of the new user.
  user.id

# Deletes an existing user.
#
# FIXME: a user should not be able to delete itself.
exports.delete = ->
  {id} = @getParams {
    id: { type: 'string' }
  }

  # Current user must be administrator.
  @checkPermission 'admin'

  # Throws an error if the user did not exist.
  @throw 'NO_SUCH_OBJECT' unless $wait @users.remove id

  # Returns true.
  true

# Changes the password of the current user.
exports.changePassword = ->
  {old, new: newP} = @getParams {
    old: { type: 'string' }
    new: { type: 'string' }
  }
  @throw 'INVALID_PARAMS' unless old? and newP?

  # Current user must be signed in.
  @checkPermission()

  # Gets the current user (which MUST exist).
  user = $wait @users.first @session.get 'user_id'

  # Checks its old password.
  @throw 'INVALID_CREDENTIAL' unless user.checkPassword old

  # Sets the new password.
  user.setPassword newP

  # Updates the user.
  $wait @users.update user

  # Returns true.
  true

# Returns the user with a given identifier.
exports.get = ->
  {id} = @getParams {
    id: { type: 'string' }
  }

  # Only an administrator can see another user.
  @checkPermission 'admin' unless @session.get 'user_id' is id

  # Retrieves the user.
  user = $wait @users.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless user

  # Returns public properties.
  @getUserPublicProperties user

# Returns all users.
exports.getAll = ->
  # Only an administrator can see all users.
  @checkPermission 'admin'

  # Retrieves the users.
  users = $wait @users.get()

  # Filters out private properties.
  for user, i in users
    users[i] = @getUserPublicProperties user

  # Returns the users.
  users

# Changes the properties of an existing user.
exports.set = ->
  {id, email, password, permission} = @getParams {
    id: { type: 'string' }
    email: { type: 'string', optional: true }
    password: { type: 'string', optional: true }
    permission: { type: 'string', optional: true }
  }

  # Only an administrator can modify an user.
  @checkPermission 'admin'

  # Retrieves the user.
  user = $wait @users.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless user

  # Updates the provided properties.
  user.set {email} if email?
  user.set {permission} if permission?
  user.setPassword password if password?

  # Updates the user.
  $wait @users.update user

  # Returns true.
  true
