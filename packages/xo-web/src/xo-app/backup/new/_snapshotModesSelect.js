import _ from 'intl'
import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { PREMIUM } from 'xoa-plans'
import { Select } from 'form'

import { FormGroup } from '../utils'

const OPTIONS = [
  {
    label: _('normal'),
    value: '',
  },
  {
    disabled: process.env.XOA_PLAN < PREMIUM,
    label: _('withMemory'),
    value: 'checkpointSnapshot',
  },
  {
    label: _('offline'),
    value: 'offlineSnapshot',
  },
]

const SnapshotModesSelect = decorate([
  provideState({
    effects: {
      setMode(_, value) {
        this.props.setGlobalSettings({
          offlineSnapshot: value === 'offlineSnapshot',
          checkpointSnapshot: value === 'checkpointSnapshot',
        })
      },
    },
    computed: {
      idSelect: generateId,
      value: (_, { checkpointSnapshot, offlineSnapshot }) =>
        checkpointSnapshot
          ? 'checkpointSnapshot'
          : offlineSnapshot
          ? 'offlineSnapshot'
          : '',
    },
  }),
  injectState,
  ({ state, effects, offlineBackup }) => (
    <FormGroup>
      <label htmlFor={state.idSelect}>
        <strong>{_('snapshotModes')}</strong>
      </label>{' '}
      <Select
        disabled={offlineBackup}
        id={state.idSelect}
        onChange={effects.setMode}
        options={OPTIONS}
        required
        simpleValue
        value={state.value}
      />
    </FormGroup>
  ),
])

SnapshotModesSelect.propTypes = {
  checkpointSnapshot: PropTypes.bool,
  offlineBackup: PropTypes.bool,
  offlineSnapshot: PropTypes.bool,
  setGlobalSettings: PropTypes.func.isRequired,
}

export { SnapshotModesSelect as default }
