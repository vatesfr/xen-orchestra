import DevTools from 'dev-tools'
import reduxThunk from 'redux-thunk'
import { connectStore as connectXo } from 'xo'
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore
} from 'redux'

import reducer from './reducer'

// ===================================================================

const enhancers = [
  applyMiddleware(reduxThunk)
]
DevTools && enhancers.push(DevTools.instrument())

const store = createStore(
  combineReducers(reducer),
  compose.apply(null, enhancers)
)

connectXo(store)

export default store
