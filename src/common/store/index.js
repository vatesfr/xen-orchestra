import reduxThunk from 'redux-thunk'
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'

import { connectStore as connectXo } from '../xo'

import DevTools from './dev-tools'
import reducer from './reducer'

// ===================================================================

const enhancers = [applyMiddleware(reduxThunk)]
DevTools && enhancers.push(DevTools.instrument())

const store = createStore(
  combineReducers(reducer),
  compose.apply(null, enhancers)
)

connectXo(store)

if (process.env.XOA_PLAN < 5) {
  require('xoa-updater').connectStore(store)
}

export default store
