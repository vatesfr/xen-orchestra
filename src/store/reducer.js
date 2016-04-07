import omitBy from 'lodash/omitBy'

import * as actions from './actions'

// ===================================================================

const createAsyncHandler = ({ error, next }) => (state, payload, action) => {
  if (action.error) {
    if (error) {
      return error(state, payload, action)
    }
  } else {
    if (next) {
      return next(state, payload, action)
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
      ? handler(state, action.payload, action)
      : state
  }
}

// ===================================================================

export default {
  lang: combineActionHandlers('en', {
    [actions.selectLang]: (_, lang) => lang
  }),

  objects: combineActionHandlers({}, {
    [actions.addObjects]: (objects, newObjects) => ({
      ...objects,
      ...newObjects
    }),
    [actions.removeObjects]: (objects, removedObjects) => omitBy(
      objects,
      (_, id) => id in removedObjects
    )
  }),

  user: combineActionHandlers(null, {
    [actions.signedIn]: {
      next: (_, user) => user
    }
  }),

  status: combineActionHandlers('disconnected', {
    [actions.connected]: () => 'connected',
    [actions.disconnected]: () => 'disconnected'
  })
}
