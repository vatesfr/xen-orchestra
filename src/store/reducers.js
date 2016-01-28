import * as actions from './actions'

// ===================================================================

// import { combineReducers } from 'redux'

const createAsyncHandler = ({ error, next }) => (state, action) => {
  if (action.error) {
    if (error) {
      return error(state, action.payload)
    }
  } else {
    if (next) {
      return next(state, action.payload)
    }
  }

  return state
}

// Action handlers are reducers but bound to a specific action.
const combineActionHandlers = (initialState, handlers) => {
  for (const action in handlers) {
    const handler = handlers[action]
    if (typeof handler === 'object') {
      handlers[action] = createAsyncHandler(handler)
    }
  }

  return (state = initialState, action) => {
    const handler = handlers[action.type]

    return handler
      ? handler(state, action)
      : state
  }
}

// ===================================================================

export const counter = combineActionHandlers(0, {
  [actions.decrement]: counter => counter - 1,
  [actions.increment]: counter => counter + 1
})

export const user = combineActionHandlers(null, {
  [actions.signIn]: {
    next: user => {
      console.log(String(actions.signIn), user)
      return user
    }
  },
  [actions.signOut]: () => null
})

export const status = combineActionHandlers('disconnected', {
  [actions.updateStatus]: status => status
})
