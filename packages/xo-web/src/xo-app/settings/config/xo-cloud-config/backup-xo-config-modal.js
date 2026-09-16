import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { Password } from 'form'

const BackupXoConfigModal = decorate([
  provideState({
    effects: {
      onChangePassphrase(_, { target: { value } }) {
        const { props } = this
        props.onChange({ ...props.value, passphrase: value })
      },
      onToggleAcknowledgment(_, { target: { checked } }) {
        const { props } = this
        props.onChange({ ...props.value, acknowledged: checked })
      },
    },
    computed: {
      acknowledgmentId: generateId,
    },
  }),
  injectState,
  ({ effects, state, value }) => (
    <div>
      <label>{_('xoCloudConfigEnterPassphrase')}</label>
      <Password autoFocus onChange={effects.onChangePassphrase} required value={value.passphrase} />
      <div className='mt-1'>
        <input
          checked={value.acknowledged}
          id={state.acknowledgmentId}
          onChange={effects.onToggleAcknowledgment}
          required
          type='checkbox'
        />{' '}
        <label htmlFor={state.acknowledgmentId}>{_('xoCloudConfigAcknowledgment')}</label>
      </div>
    </div>
  ),
])

export default BackupXoConfigModal
