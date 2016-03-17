import cookies from 'cookies-js'
import isFunction from 'lodash/isFunction'
import Xo from 'xo-lib'
import { createBackoff } from 'jsonrpc-websocket-client'

// ===================================================================

const createAction = (() => {
  const { defineProperty } = Object
  const noop = function () {
    if (arguments.length) {
      throw new Error('this action expects no payload!')
    }
  }

  return (type, payloadCreator = noop) => {
    const createActionObject = (payload) => {
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

const xo = new Xo({
  url: 'localhost:9000'
})

export const connected = createAction('CONNECTED')
export const disconnected = createAction('DISCONNECTED')
export const signedIn = createAction('SIGNED_IN', (user) => user)
export const addObjects = createAction('ADD_OBJECTS', (objects) => objects)
export const removeObjects = createAction('REMOVE_OBJECTS', (objects) => objects)

export const signIn = createAction('SIGN_IN', (credentials) => (dispatch) => {
  xo.signIn(credentials).then(() => {
    dispatch(signedIn(xo.user))
  })
})

export const connect = createAction('CONNECT', () => (dispatch) => {
  const connect = () => {
    xo.open(createBackoff()).catch((error) => {
      console.error('failed to connect to xo-server', error)
    })
  }
  xo.on('scheduledAttempt', ({ delay }) => {
    console.log('next attempt in %s ms', delay)
  })
  connect()

  xo.on('open', () => {
    dispatch(connected())

    // FIXME: maybe the token should be stored initially in the Redux
    // store. (Maybe not)
    const token = cookies.get('token')
    if (token) {
      dispatch(signIn({ token }))
    }
  })
  xo.on('closed', () => {
    dispatch(disconnected())

    connect()
  })
  xo.on('notification', (notification) => {
    if (notification.method !== 'all') {
      return
    }

    const { params } = notification
    dispatch((
      params.type === 'enter'
        ? addObjects
        : removeObjects
    )(params.items))
  })
})
