{$waitPromise} = require '../fibers-utils'

#=====================================================================

# Creates a new user.
exports.create = (session, request) ->
  {email, password, permission} = request.params
  @throw 'INVALID_PARAMS' unless email? and password?

  # Current user must be administrator.
  @checkPermission session, 'admin'

  # Creates the user.
  user = $waitPromise @xo.users.create email, password, permission

  # Returns the identifier of the new user.
  user.id

# Deletes an existing user.
#
# FIXME: a user should not be able to delete itself.
exports.delete = (session, request) ->
  {id} = request.params
  @throw 'INVALID_PARAMS' unless id?

  # Current user must be administrator.
  @checkPermission session, 'admin'

  # Throws an error if the user did not exist.
  @throw 'NO_SUCH_OBJECT' unless $waitPromise @xo.users.remove id

  # Returns true.
  true

# Changes the password of the current user.
exports.changePassword = (session, request) ->
  {old, new: newP} = request.params
  @throw 'INVALID_PARAMS' unless old? and newP?

  # Current user must be signed in.
  @checkPermission session

  # Gets the current user (which MUST exist).
  user = $waitPromise @xo.users.first session.get 'user_id'

  # Checks its old password.
  @throw 'INVALID_CREDENTIAL' unless user.checkPassword old

  # Sets the new password.
  user.setPassword newP

  # Updates the user.
  $waitPromise @xo.users.update user

  # Returns true.
  true

# Returns the user with a given identifier.
exports.get = (session, request) ->
  {id} = request.params
  @throw 'INVALID_PARAMS' unless id?

  # Only an administrator can see another user.
  @checkPermission session, 'admin' unless session.get 'user_id' is id

  # Retrieves the user.
  user = $waitPromise @xo.users.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless user

  # Returns public properties.
  @getUserPublicProperties user

# Returns all users.
exports.getAll = (session) ->
  # Only an administrator can see all users.
  @checkPermission session, 'admin'

  # Retrieves the users.
  users = $waitPromise @xo.users.get()

  # Filters out private properties.
  for user, i in users
    users[i] = @getUserPublicProperties user

  # Returns the users.
  users

# Changes the properties of an existing user.
exports.set = (session, request) ->
  {id, email, password, permission} = request.params
  @throw 'INVALID_PARAMS' unless id? and (email? or password? or permission?)

  # Only an administrator can modify an user.
  @checkPermission session, 'admin'

  # Retrieves the user.
  user = $waitPromise @xo.users.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless user

  # Updates the provided properties.
  user.set {email} if email?
  user.set {permission} if permission?
  user.setPassword password if password?

  # Updates the user.
  $waitPromise @xo.users.update user

  # Returns true.
  true
