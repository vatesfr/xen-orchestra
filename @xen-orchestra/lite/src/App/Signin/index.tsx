import React from 'react'
import { withState } from 'reaclette'
import { FormattedMessage } from 'react-intl'

import Icon from '../../components/Icon'

interface ParentState {}

interface State {
  password: string
}

interface Props {}

interface ParentEffects {
  connectToXapi: (password: string) => void
}

interface Effects {
  setPassword: (event: React.ChangeEvent<HTMLInputElement>) => void
  submit: (event: React.MouseEvent<HTMLButtonElement>) => void
}

interface Computed {}

const Signin = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      password: '',
    }),
    effects: {
      setPassword: function ({ currentTarget: { value: password } }) {
        this.state.password = password
      },
      submit: function () {
        this.effects.connectToXapi(this.state.password)
      },
    },
  },
  ({ effects, state }) => (
    <form onSubmit={e => e.preventDefault()}>
      Login: <input disabled value='root' />
      Password: <input autoFocus onChange={effects.setPassword} type='password' value={state.password} />
      <button type='submit' onClick={effects.submit}>
        <FormattedMessage id='connect' /> <Icon icon='coffee' />
      </button>
    </form>
  )
)

export default Signin
