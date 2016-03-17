import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore
} from 'redux'
import {
  hashHistory
} from 'react-router'
import {
  syncHistoryWithStore,
  routerReducer
} from 'react-router-redux'

import DevTools from '../dev-tools'
import reducer from './reducer'

// ===================================================================

const store = createStore(
  combineReducers({
    ...reducer,
    routing: routerReducer
  }),
  compose(
    applyMiddleware(reduxPromise),
    applyMiddleware(reduxThunk),
    DevTools.instrument()
  )
)
export default store

export const history = syncHistoryWithStore(hashHistory, store)

// -------------------------------------------------------------------

export * as actions from './actions'
