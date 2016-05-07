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
      if (isFunction(payload)) {
        return payload
      }

      let then
      if (
        payload != null &&
        isFunction(then = payload.then)
      ) {
        return then.call(payload, createActionObject)
      }

      return { type, payload }
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
