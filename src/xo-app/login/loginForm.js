import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import {signIn, signedIn, patchSession } from '../../store/actions'

class LoginForm extends Component {

  handleSigninIn (e) {
    const { actions } = this.props
    e.preventDefault()
    actions.signIn()
  }

  updateLogin (event) {
    this.props.actions.patchSession({login: event.target.value})
  }

  updatePassword (event) {
    this.props.actions.patchSession({password: event.target.value})
  }

  render () {
    /*remeber : this.propos.session is from the connect call*/
    const { login, password, isLoggingIn } = this.props.session
    return (
      <div>
          <form onSubmit={(e) => this.handleSigninIn(e)}>
            <input type='text' name='login' value={login} onChange={(e) => this.updateLogin(e)/* autobinding is only in ES5*/}/>
            <input type='password' name='password' value={password} onChange={(e) => this.updatePassword(e)}/>
            {isLoggingIn &&
              <p>signing  in , waiting for server</p>
            }
            {!isLoggingIn &&
              <input type='submit' value='Sign in'/>
            }
          </form>
      </div>
    )
  }
}

/* Which part of the global app state this component can see ?
 * make it as small as possible to reduce the rerender */
export default connect(
  (state) => {
    return {session: state.session}
  },
   /* Transmit action and actions creators
   * It can be usefull to transmit only a few selected actions.
   * Also bind them to dispatch , so  the component can call action creator directly,
   * without having to manually wrap each
   */
   (dispatch) => {
     return {
       actions: bindActionCreators({
         signIn, patchSession, signedIn
       },
       dispatch) }
   }
)(LoginForm)
