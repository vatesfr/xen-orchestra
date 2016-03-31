import hashHistory from 'react-router/lib/hashHistory'
import reduxThunk from 'redux-thunk'
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

import DevTools from '../dev-tools'
import reducer from './reducer'

// ===================================================================

const store = createStore(
  combineReducers({
    ...reducer,
    routing: routerReducer
  }),
  compose(
    applyMiddleware(reduxThunk),
    DevTools ? DevTools.instrument() : (value) => value
  )
)
export default store

export const history = syncHistoryWithStore(hashHistory, store)
