import React from 'react'
import { injectState, provideState } from 'reaclette'
import { FormattedMessage } from 'react-intl'

import Icon from '../../components/Icon'
import { EffectContext, RenderParams } from '../../../types/reaclette'

const Signin = [
  provideState({
    initialState: () => ({
      password: '',
    }),
    effects: {
      setPassword: function (
        this: EffectContext,
        { target: { value: password } }: { target: { value: string } }
      ) {
        this.state.password = password
      },
      submit: function (this: EffectContext) {
        this.effects.connectToXapi(this.state.password)
      },
    },
  }),
  injectState,
  ({ effects, state }: RenderParams) => (
    <form onSubmit={e => e.preventDefault()}>
      Login: <input disabled value='root' />
      Password:{' '}
      <input
        autoFocus
        onChange={effects.setPassword}
        type='password'
        value={state.password}
      />
      <button type='submit' onClick={effects.submit}>
        <FormattedMessage id='connect' /> <Icon icon='coffee' />
      </button>
    </form>
  ),
].reduceRight((value, fn) => fn(value))

export default Signin
