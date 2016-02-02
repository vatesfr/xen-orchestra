import * as actions from './actions'
import { combineReducers } from 'redux'

import initialState from './initialStoreState'
/* Reducers are synchronous and repeatable : it's not the place to put api call
*/

function sessionReducer (currentSession = initialState.session, action) {
  switch (action.type) {
    case actions.SESSION_PATCH :
      let payload = action.payload
      // don't change loggued state from this action
      delete payload.isLoggingIn
      delete payload.isLoggingOut
      delete payload.isLoggued
      return Object.assign(
        {},
        currentSession,
        payload // login , password
      )
    case actions.SIGN_IN :
      // user tried to sign in
      return Object.assign(
        {},
        currentSession,
        action.payload, // login , password
        {isLoggingIn: true}
      )

    case actions.SIGN_OUT :
      return Object.assign({}, currentSession, {isLoggingOut: true})

    case actions.SIGNED_OUT:
      // when user is signed out : reset session
      return initialState.session

    case actions.SIGNED_IN :
      // when user is signed in : session informations are received from server
      return Object.assign(
        {},
        currentSession,
        action.payload,
        {
          isLoggued: true,
          isLoggingIn: false,
          isLoggingOut: false,
          password: 'redacted , don t need it '
        }
      )

    default :
      return currentSession // reducer HAVE TO return a state, even when they did nothing
  }
}

function xoApiReducer (state = initialState.xoApi, action) {
  let payload = action.payload || {}
  switch (action.type){
    case actions.VM_EDIT:
      payload = Object.assign({},
        state[action.payload.id],
        payload,
        {isSaved: false}
      )
      return Object.assign(
        {},
        state,
        {
          [action.payload.id]: payload
        }
      )

    case actions.VM_SAVE:
    console.log(' SAVE ',action.payload)
      return Object.assign(
        {},
        state,
        {
          [action.payload.id]: {isSaving:true}
        }
      )
      return state
    case actions.VM_SAVED:
      // put the VM at its real id if it's a creation
      payload = Object.assign({},
        state[action.payload.id],
        payload,
        {isSaved: true, isSaving: false}
      )
      console.log('VM_SAVED',payload)
      return Object.assign(
        {},
        state,
        {
          [action.payload.id]: payload
        }
      )
  }
  return state
}

function componentsReducer (state = initialState.components, action) {
  return state
}

export default combineReducers({
  session: sessionReducer,
  components: componentsReducer,
  xoApi: xoApiReducer
})
