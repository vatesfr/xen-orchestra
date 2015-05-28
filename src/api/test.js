import {delay} from 'bluebird'

// ===================================================================

export function hasPermission ({userId, objectId, permission}) {
  return this.hasPermission(userId, objectId, permission)
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
  return delay(returnValue, +duration)
}

wait.params = {
  duration: {
    type: 'string'
  }
}
