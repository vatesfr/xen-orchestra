import DevTools from 'dev-tools'
import hashHistory from 'react-router/lib/hashHistory'
import reduxThunk from 'redux-thunk'
import { connectStore as connectXo } from 'xo'
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore
} from 'redux'
import {
  syncHistoryWithStore,
  routerReducer
} from 'react-router-redux'

import reducer from './reducer'

// ===================================================================

const enhancers = [
  applyMiddleware(reduxThunk)
]
DevTools && enhancers.push(DevTools.instrument())

const store = createStore(
  combineReducers({
    ...reducer,
    routing: routerReducer
  }),
  compose.apply(null, enhancers)
)

connectXo(store)

export default store

export const history = syncHistoryWithStore(hashHistory, store)
