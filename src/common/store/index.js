import reduxThunk from 'redux-thunk'
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore
} from 'redux'

import { connectStore as connectXo } from '../xo'

import DevTools from './dev-tools'
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
connectXoaUpdater(store)

export default store
