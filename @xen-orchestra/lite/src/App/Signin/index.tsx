import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'

import Button from '../../components/Button'
import Checkbox from '../../components/Checkbox'
import Input from '../../components/Input'
import IntlMessage from '../../components/IntlMessage'

interface ParentState {
  error: string
}

interface State {
  password: string
  rememberMe: boolean
}

interface Props {}

interface ParentEffects {
  connectToXapi: (password: string, rememberMe: boolean) => void
}

interface Effects {
  setRememberMe: (event: React.ChangeEvent<HTMLInputElement>) => void
  setPassword: (event: React.ChangeEvent<HTMLInputElement>) => void
  submit: (event: React.MouseEvent<HTMLButtonElement>) => void
}

interface Computed {}

const Wrapper = styled.div`
  height: 100vh;
  display: flex;
`

const Form = styled.form`
  width: 20em;
  margin: auto;
  text-align: center;
`

const Fieldset = styled.fieldset`
  border: 0;
  padding-left: 0;
  padding-right: 0;
`

const RememberMe = styled(Fieldset)`
  text-align: start;
  vertical-align: baseline;
`

const Error = styled.p`
  color: #a33;
`

const Signin = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      password: '',
      rememberMe: false,
    }),
    effects: {
      setRememberMe: function ({ currentTarget: { checked: rememberMe } }) {
        this.state.rememberMe = rememberMe
      },
      setPassword: function ({ currentTarget: { value: password } }) {
        this.state.password = password
      },
      submit: function () {
        this.effects.connectToXapi(this.state.password, this.state.rememberMe)
      },
    },
  },
  ({ effects, state }) => (
    <Wrapper>
      <Form onSubmit={e => e.preventDefault()}>
        <img src='//lite.xen-orchestra.com/dist/logo.png' />
        <h1>Xen Orchestra Lite</h1>
        <Fieldset>
          <Input disabled label={<IntlMessage id='login' />} value='root' />
        </Fieldset>
        <Fieldset>
          <Input
            autoFocus
            label={<IntlMessage id='password' />}
            onChange={effects.setPassword}
            type='password'
            value={state.password}
          />
        </Fieldset>
        <RememberMe>
          <label>
            <Checkbox onChange={effects.setRememberMe} checked={state.rememberMe} />
            &nbsp;
            <IntlMessage id='rememberMe' />
          </label>
        </RememberMe>
        <Error>{state.error}</Error>
        <Button type='submit' onClick={effects.submit}>
          <IntlMessage id='connect' />
        </Button>
      </Form>
    </Wrapper>
  )
)

export default Signin
