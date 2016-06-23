import _ from 'intl'
import React, {
  Component
} from 'react'
import { propTypes } from 'utils'

@propTypes({
  onSubmit: propTypes.func.isRequired
})
export default class SignIn extends Component {
  render () {
    return <form onSubmit={event => {
      event.preventDefault()

      const { refs } = this
      this.props.onSubmit({
        password: refs.password.value,
        username: refs.username.value
      })
    }}>
      <p>
        <label>
          {_('usernameLabel')}
        </label>
        <input type='text' ref='username' />
      </p>
      <p>
        <label>
          {_('passwordLabel')}
        </label>
        <input type='password' ref='password' />
      </p>
      <p>
        <button type='submit'>
          {_('signInButton')}
        </button>
      </p>
    </form>
  }
}
