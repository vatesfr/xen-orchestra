import cookies from 'cookies-js'

import invoke from '../invoke'

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
  lang: combineActionHandlers(cookies.get('lang') || 'en', {
    [actions.selectLang]: (_, lang) => {
      cookies.set('lang', lang)

      return lang
    }
  }),

  permissions: combineActionHandlers({}, {
    [actions.updatePermissions]: (_, permissions) => permissions
  }),

  objects: combineActionHandlers({
    all: {}, // Mutable for performance!
    byType: {}
  }, {
    [actions.updateObjects]: ({ all, byType: prevByType }, updates) => {
      const byType = { ...prevByType }
      const get = type => {
        const curr = byType[type]
        const prev = prevByType[type]
        return curr === prev
          ? (byType[type] = { ...prev })
          : curr
      }

      for (const id in updates) {
        const object = updates[id]
        const previous = all[id]

        if (object) {
          const { type } = object

          all[id] = object
          get(type)[id] = object

          if (previous && previous.type !== type) {
            delete get(previous.type)[id]
          }
        } else if (previous) {
          delete all[id]
          delete get(previous.type)[id]
        }
      }

      return { all, byType, fetched: true }
    }
  }),

  user: combineActionHandlers(null, {
    [actions.signedIn]: {
      next: (_, user) => user
    }
  }),

  status: combineActionHandlers('disconnected', {
    [actions.connected]: () => 'connected',
    [actions.disconnected]: () => 'disconnected'
  }),

  xoaUpdaterState: combineActionHandlers('disconnected', {
    [actions.xoaUpdaterState]: (_, state) => state
  }),
  xoaTrialState: combineActionHandlers({}, {
    [actions.xoaTrialState]: (_, state) => state
  }),
  xoaUpdaterLog: combineActionHandlers([], {
    [actions.xoaUpdaterLog]: (_, log) => log
  }),
  xoaRegisterState: combineActionHandlers({state: '?'}, {
    [actions.xoaRegisterState]: (_, registration) => registration
  }),
  xoaConfiguration: combineActionHandlers({proxyHost: '', proxyPort: '', proxyUser: ''}, { // defined values for controlled inputs
    [actions.xoaConfiguration]: (_, configuration) => {
      delete configuration.password
      return configuration
    }
  })

}
