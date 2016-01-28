import Xo from 'xo-lib'
import { createBackoff } from 'jsonrpc-websocket-client'

// ===================================================================

const createAction = (() => {
  const { defineProperty } = Object
  const identity = payload => payload

  return (type, payloadCreator = identity) => defineProperty(
    (...args) => ({
      type,
      payload: payloadCreator(...args)
    }),
    'toString',
    { value: () => type }
  )
})()

// ===================================================================

const xo = new Xo({
  url: 'localhost:9000'
})
{
  const connect = () => {
    xo.open(createBackoff()).catch(error => {
      console.error('failed to connect to xo-server', error)
    })
  }
  xo.on('scheduledAttempt', ({ delay }) => {
    console.log('next attempt in %s ms', delay)
  })

  xo.on('closed', connect)
  connect()
}

export const updateStatus = createAction('UPDATE_STATUS')
export const signIn = createAction('SIGN_IN', async credentials => {
  await xo.signIn(credentials)
})
export const signOut = createAction('SIGN_OUT')

export const increment = createAction('INCREMENT')
export const decrement = createAction('DECREMENT')
