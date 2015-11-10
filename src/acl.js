// These global variables are not a problem because the algorithm is
// synchronous.
let permissionsByObject
let getObject

// -------------------------------------------------------------------

const authorized = () => true // eslint-disable-line no-unused-vars
const forbiddden = () => false // eslint-disable-line no-unused-vars

function and (...checkers) { // eslint-disable-line no-unused-vars
  return function (object, permission) {
    for (const checker of checkers) {
      if (!checker(object, permission)) {
        return false
      }
    }
    return true
  }
}

function or (...checkers) { // eslint-disable-line no-unused-vars
  return function (object, permission) {
    for (const checker of checkers) {
      if (checker(object, permission)) {
        return true
      }
    }
    return false
  }
}

// -------------------------------------------------------------------

function checkMember (memberName) {
  return function (object, permission) {
    const member = object[memberName]
    return checkAuthorization(member, permission)
  }
}

function checkSelf ({ id }, permission) {
  const permissionsForObject = permissionsByObject[id]

  return (
    permissionsForObject &&
    permissionsForObject[permission]
  )
}

// ===================================================================

const checkAuthorizationByTypes = {
  host: or(checkSelf, checkMember('$pool')),

  message: checkMember('$object'),

  network: or(checkSelf, checkMember('$pool')),

  SR: or(checkSelf, checkMember('$pool')),

  task: checkMember('$host'),

  VBD: checkMember('VDI'),

  // Access to a VDI is granted if the user has access to the
  // containing SR or to a linked VM.
  VDI (vdi, permission) {
    // Check authorization for the containing SR.
    if (checkAuthorization(vdi.$SR, permission)) {
      return true
    }

    // Check authorization for each of the connected VMs.
    for (const { VM: vm } of vdi.$VBDs) {
      if (checkAuthorization(vm, permission)) {
        return true
      }
    }

    return false
  },

  VIF: or(checkMember('$network'), checkMember('$VM')),

  VM: or(checkSelf, checkMember('$container')),

  'VM-snapshot': checkMember('$snapshot_of'),

  'VM-template': authorized
}

function checkAuthorization (objectId, permission) {
  const object = getObject(objectId)
  const checker = checkAuthorizationByTypes[object.type] || checkSelf

  return checker(object, permission)
}

// -------------------------------------------------------------------

export default function (
  permissionsByObject_,
  getObject_,
  permissions
) {
  // Assign global variables.
  permissionsByObject = permissionsByObject_
  getObject = getObject_

  try {
    for (const [objectId, permission] of permissions) {
      if (!checkAuthorization(objectId, permission)) {
        return false
      }
    }

    return true
  } finally {
    // Free the global variables.
    permissionsByObject = getObject = null
  }
}
