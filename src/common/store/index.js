import DevTools from 'dev-tools'
import reduxThunk from 'redux-thunk'
import { connectStore as connectXo } from 'xo'
import { connectStore as connectXoaUpdater } from 'xoa-updater'
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
connectXoaUpdater(store)

export default store
