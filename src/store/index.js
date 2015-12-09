import reduxPromise from 'redux-promise'
// import reduxThunk from 'redux-thunk'
import { createHashHistory } from 'history'
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore
} from 'redux'
import {
  reduxReactRouter,
  routerStateReducer
} from 'redux-router'

import * as reducers from './reducers'

// ===================================================================

export default compose(
  applyMiddleware(reduxPromise),
  // applyMiddleware(reduxThunk),
  reduxReactRouter({
    createHistory: createHashHistory
  })
)(createStore)(combineReducers({
  ...reducers,
  router: routerStateReducer
}))

export * as actions from './actions'
