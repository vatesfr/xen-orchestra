
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore
} from 'redux'

import reducer from './reducers'
import thunk   from 'redux-thunk'
import initialState from './initialStoreState'


let createStoreWithMiddleware = applyMiddleware(thunk)(createStore);


const store = createStoreWithMiddleware(reducer)

export default store

// ===================================================================
/*
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
*/
