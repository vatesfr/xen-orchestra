import isFunction from 'lodash/isFunction'

// ===================================================================

const createAction = (() => {
  const { defineProperty } = Object
  const noop = function () {
    if (arguments.length) {
      throw new Error('this action expects no payload!')
    }
  }

  return (type, payloadCreator = noop) => {
    const createActionObject = payload => {
      // Thunks
      if (isFunction(payload)) {
        return payload
      }

      return payload === undefined
        ? { type }
        : { type, payload }
    }

    return defineProperty(
      (...args) => createActionObject(payloadCreator(...args)),
      'toString',
      { value: () => type }
    )
  }
})()

// ===================================================================

export const selectLang = createAction('SELECT_LANG', lang => lang)

// ===================================================================

export const connected = createAction('CONNECTED')
export const disconnected = createAction('DISCONNECTED')

export const updateObjects = createAction('UPDATE_OBJECTS', updates => updates)
export const updatePermissions = createAction('UPDATE_PERMISSIONS', permissions => permissions)

export const signedIn = createAction('SIGNED_IN', user => user)
export const signedOut = createAction('SIGNED_OUT')

export const updaterDidToto = createAction('UPDATER_DID_TOTO', (payload) => payload)
