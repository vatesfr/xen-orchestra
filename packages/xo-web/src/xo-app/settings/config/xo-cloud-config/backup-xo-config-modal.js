import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
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
  }),
  injectState,
  ({ effects, value }) => (
    <div>
      <label>{_('xoCloudConfigEnterPassphrase')}</label>
      <Password autoFocus onChange={effects.onChangePassphrase} value={value.passphrase} />
      <div className='form-check mt-1'>
        <label className='form-check-label'>
          <input
            checked={value.acknowledged}
            className='form-check-input'
            onChange={effects.onToggleAcknowledgment}
            required
            type='checkbox'
          />
          {_('xoCloudConfigAcknowledgment')}
        </label>
      </div>
    </div>
  ),
])

export default BackupXoConfigModal
