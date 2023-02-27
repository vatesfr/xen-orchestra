import cookies from 'js-cookie'
import omit from 'lodash/omit.js'

import invoke from '../invoke'

import * as actions from './actions'

// ===================================================================

const createAsyncHandler =
  ({ error, next }) =>
  (state, payload, action) => {
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

      return (state = initialState, action) =>
        action.type === actionType ? handler(state, action.payload, action) : state
    }

    return (state = initialState, action) => {
      const handler = handlers[action.type]

      return handler ? handler(state, action.payload, action) : state
    }
  }
)

// ===================================================================

export default {
  lang: combineActionHandlers(cookies.get('lang') || 'en', {
    [actions.selectLang]: (_, lang) => {
      cookies.set('lang', lang)

      return lang
    },
  }),

  permissions: combineActionHandlers(
    {},
    {
      [actions.updatePermissions]: (_, permissions) => permissions,
    }
  ),

  // These IDs are used temporarily to be preselected in backup/new/vms
  homeVmIdsSelection: combineActionHandlers([], {
    [actions.setHomeVmIdsSelection]: (_, homeVmIdsSelection) => homeVmIdsSelection,
  }),

  // whether a resource is currently being installed: `hubInstallingResources[<template id>]`
  hubInstallingResources: combineActionHandlers(
    {},
    {
      [actions.markHubResourceAsInstalling]: (prevHubInstallingResources, id) => ({
        ...prevHubInstallingResources,
        [id]: true,
      }),
      [actions.markHubResourceAsInstalled]: (prevHubInstallingResources, id) => omit(prevHubInstallingResources, id),
    }
  ),

  // whether a resource is currently being created: `recipeCreatingResources[<recipe id>]`
  recipeCreatingResources: combineActionHandlers(
    {},
    {
      [actions.markRecipeAsCreating]: (prevRecipeCreatingResources, id) => ({
        ...prevRecipeCreatingResources,
        [id]: true,
      }),
      [actions.markRecipeAsDone]: (prevRecipeCreatedResources, id) => omit(prevRecipeCreatedResources, id),
    }
  ),

  objects: combineActionHandlers(
    {
      all: {}, // Mutable for performance!
      byType: {},
      fetched: false,
    },
    {
      [actions.updateObjects]: ({ all, byType: prevByType, fetched }, updates) => {
        const byType = { ...prevByType }
        const get = type => {
          const curr = byType[type]
          const prev = prevByType[type]
          return curr === prev ? (byType[type] = { ...prev }) : curr
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

        return { all, byType, fetched }
      },
      [actions.markObjectsFetched]: state => ({
        ...state,
        fetched: true,
      }),
    }
  ),

  user: combineActionHandlers(null, {
    [actions.signedIn]: {
      next: (_, user) => user,
    },
  }),

  status: combineActionHandlers('disconnected', {
    [actions.connected]: () => 'connected',
    [actions.disconnected]: () => 'disconnected',
  }),

  xoaUpdaterState: combineActionHandlers('disconnected', {
    [actions.setXoaUpdaterState]: (_, state) => state,
  }),
  xoaTrialState: combineActionHandlers(
    {},
    {
      [actions.setXoaTrialState]: (_, state) => state,
    }
  ),
  xoaUpdaterLog: combineActionHandlers([], {
    [actions.setXoaUpdaterLog]: (_, log) => log,
  }),
  xoaRegisterState: combineActionHandlers(
    { state: '?' },
    {
      [actions.setXoaRegisterState]: (_, registration) => registration,
    }
  ),
  xoaConfiguration: combineActionHandlers(
    { proxyHost: '', proxyPort: '', proxyUser: '' },
    {
      // defined values for controlled inputs
      [actions.setXoaConfiguration]: (_, configuration) => {
        delete configuration.password
        return configuration
      },
    }
  ),
}
