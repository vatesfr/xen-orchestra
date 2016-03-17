import React, {
  Component,
  PropTypes
} from 'react'
import {
  defineMessages,
  FormattedMessage
} from 'react-intl'

const messages = defineMessages({
  usernameLabel: {
    id: 'usernameLabel',
    defaultMessage: 'Username'
  },
  passwordLabel: {
    id: 'passwordLabel',
    defaultMessage: 'Password'
  },
  signInButton: {
    id: 'signInButton',
    defaultMessage: 'Sign in'
  }
})

export default class extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired
  };

  render () {
    return <form onSubmit={(event) => {
      event.preventDefault()

      const { refs } = this
      this.props.onSubmit({
        password: refs.password.value,
        username: refs.username.value
      })
    }}>
      <p>
        <label>
          <FormattedMessage
            {...messages.usernameLabel}
          />:
        </label>
        <input type='text' ref='username' />
      </p>
      <p>
        <label>
          <FormattedMessage
            {...messages.passwordLabel}
          />:
        </label>
        <input type='password' ref='password' />
      </p>
      <p>
        <button type='submit'>
          <FormattedMessage
            {...messages.signInButton}
          />
        </button>
      </p>
    </form>
  }
}
