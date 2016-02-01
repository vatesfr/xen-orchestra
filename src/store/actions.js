/*import Xo from 'xo-lib'
import { createBackoff } from 'jsonrpc-websocket-client'*/

/* action type */
export const VM_CREATE = 'VM_CREATE'    // create a VM in store
export const VM_EDIT = 'VM_EDIT'        // edit a vm in store
export const VM_SAVE = 'VM_SAVE'        // want to save a vm from store to server
export const VM_SAVED = 'VM_SAVED'      // VM is saved on server

export const SIGN_IN = 'SIGN_IN'     // ask to signin
export const SIGNED_IN = 'SIGNED_IN'    // is signed in
export const SIGN_OUT = 'SIGN_OUT'   // want to sign out
export const SIGNED_OUT = 'SIGNED_OUT'  // signed out
export const SESSION_PATCH = 'SESSION_PATCH'  // signed out

/* action creator
 * they HAVE TO return an action with the mandatory field type, and an optiona payload
 * they MAY dispatch ( emit ) other actions, async or not
 * action will be used by reducers
 */
export function patchSession (patch) {
  return {
    type: SESSION_PATCH,
    payload: patch
  }
}
export function signIn () {
  // using redux thunk https://github.com/gaearon/redux-thunk
  // instead of returning one promise, it can dispatch multiple events
  // that way it become trivial to inform user of progress
  return dispatch => {
    setTimeout(() => {
      // Yay! Can invoke sync or async actions with `dispatch`
      dispatch(signedIn({userId: Math.floor(Math.random() * 1000)}))
    }, 10)

    dispatch({type: 'SIGN_IN'}) // immediatly inform the sore that we'll try to signin
  }
}

// you can also directly return an action
export function signedIn (payload) {
  return {
    type: 'SIGNED_IN',
    payload
  }
}

export function VMCreate (payload) {
  return {
    type: VM_CREATE,
    payload
  }
}

export function VMEdit( payload){
  // should check if there s a vm id ?
  return {
    type: VM_EDIT,
    payload
  }
}

export function VMSave (vmId) {
  //should call xoApi and save to server
  return dispatch => {
    setTimeout(function(){
      console.log('really save')
      // Yay! Can invoke sync or async actions with `dispatch`
      dispatch(VMSaved({id: Math.floor(Math.random() * 1000)}))
    }, 1000)

    dispatch({
      type: VM_SAVE,
      payload: {id: vmId}
    }) // immediatly inform the sore that we'll try to save
  }

}


export function VMSaved (vm) {
  //xoAPi is happy, let's tell everyone this vm is save
  return {
    type: VM_SAVED,
    payload: vm
  }
}
