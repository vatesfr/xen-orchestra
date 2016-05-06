import omitBy from 'lodash/omitBy'
import { invoke } from 'utils'

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
const combineActionHandlers = invoke(
  Object.hasOwnProperty,
  obj => {
    for (const prop in obj) {
      return prop
    }
  },
  (has, firstProp) => (initialState, handlers) => {
    let n = 0
    for (const actionType in handlers) {
      if (has.call(handlers, actionType)) {
        if (actionType === 'undefined') {
          throw new Error('invalid action type: undefined')
        }

        ++n

        const handler = handlers[actionType]
        if (typeof handler === 'object') {
          handlers[actionType] = createAsyncHandler(handler)
        }
      }
    }

    if (!n) {
      throw new Error('no action handlers declared')
    }

    // Optimization for this special case.
    if (n === 1) {
      const actionType = firstProp(handlers)
      const handler = handlers[actionType]

      return (state = initialState, action) => (
        action.type === actionType
          ? handler(state, action.payload, action)
          : state
      )
    }

    return (state = initialState, action) => {
      const handler = handlers[action.type]

      return handler
        ? handler(state, action.payload, action)
        : state
    }
  }
)

// ===================================================================

export default {
  lang: combineActionHandlers('en', {
    [actions.selectLang]: (_, lang) => lang
  }),

  permissions: combineActionHandlers({}, {
    [actions.updatePermissions]: (_, permissions) => permissions
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
