import reduxThunk from 'redux-thunk'
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

export default compose(
  applyMiddleware(reduxThunk),
  reduxReactRouter({ createHistory: createHashHistory })
)(createStore)(combineReducers({
  router: routerStateReducer
}))
