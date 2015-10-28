export function getPermissionsForUser ({ userId }) {
  return this.getPermissionsForUser(userId)
}

getPermissionsForUser.permission = 'admin'

getPermissionsForUser.params = {
  userId: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export function hasPermission ({ userId, objectId, permission }) {
  return this.hasPermissions(userId, [
    [ objectId, permission ]
  ])
}

hasPermission.permission = 'admin'

hasPermission.params = {
  userId: {
    type: 'string'
  },
  objectId: {
    type: 'string'
  },
  permission: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export function wait ({duration, returnValue}) {
  return new Promise(resolve => {
    setTimeout(+duration, () => {
      resolve(returnValue)
    })
  })
}

wait.params = {
  duration: {
    type: 'string'
  }
}
