{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

# Creates a new user.
exports.create = $coroutine ({email, password, permission}) ->
  # Creates the user.
  user = $wait @users.create email, password, permission

  return user.get('id')
exports.create.permission = 'admin'
exports.create.params = {
  email: { type: 'string' }
  password: { type: 'string' }
  permission: { type: 'string', optional: true}
}

# Deletes an existing user.
#
# FIXME: a user should not be able to delete itself.
exports.delete = $coroutine ({id}) ->
  # The user cannot delete himself.
  @throw 'INVALID_PARAMS' if id is @session.get 'user_id'

  # Throws an error if the user did not exist.
  @throw 'NO_SUCH_OBJECT' unless $wait @users.remove id

  return true
exports.delete.permission = 'admin'
exports.delete.params = {
  id: { type: 'string' }
}

# Changes the password of the current user.
exports.changePassword = $coroutine ({old, new: newP}) ->
  # Gets the current user (which MUST exist).
  user = $wait @users.first @session.get 'user_id'

  # Checks its old password.
  @throw 'INVALID_CREDENTIAL' unless $wait user.checkPassword old

  # Sets the new password.
  $wait user.setPassword newP

  # Updates the user.
  $wait @users.update user

  return true
exports.changePassword.permission = '' # Signed in.
exports.changePassword.params = {
  old: { type: 'string' }
  new: { type: 'string' }
}

# Returns the user with a given identifier.
exports.get = $coroutine ({id}) ->
  # Only an administrator can see another user.
  @checkPermission 'admin' unless @session.get 'user_id' is id

  # Retrieves the user.
  user = $wait @users.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless user

  return @getUserPublicProperties user
exports.get.params = {
  id: { type: 'string' }
}

# Returns all users.
exports.getAll = $coroutine ->
  # Retrieves the users.
  users = $wait @users.get()

  # Filters out private properties.
  for user, i in users
    users[i] = @getUserPublicProperties user

  return users
exports.getAll.permission = 'admin'

# Changes the properties of an existing user.
exports.set = $coroutine ({id, email, password, permission}) ->
  # Retrieves the user.
  user = $wait @users.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless user

  # Updates the provided properties.
  user.set {email} if email?
  user.set {permission} if permission?
  $wait user.setPassword password if password?

  # Updates the user.
  $wait @users.update user

  return true
exports.set.permission = 'admin'
exports.set.params = {
  id: { type: 'string' }
  email: { type: 'string', optional: true }
  password: { type: 'string', optional: true }
  permission: { type: 'string', optional: true }
}
