import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SmartBackupPreview from 'smart-backup'
import Tooltip from 'tooltip'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { get } from 'lodash'
import { injectState } from 'reaclette'
import { Select } from 'form'
import { SelectPool, SelectTag } from 'select-objects'

import { FormGroup } from './../utils'

const VMS_STATUSES_OPTIONS = [
  { value: 'All', label: _('vmStateAll') },
  { value: 'Running', label: _('vmStateRunning') },
  { value: 'Halted', label: _('vmStateHalted') },
]

export default decorate([
  connectStore({
    vms: createGetObjectsOfType('VM'),
  }),
  injectState,
  ({ state, effects, vms }) => (
    <div>
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartStatusTitle')}</strong>
        </label>
        <Select
          options={VMS_STATUSES_OPTIONS}
          onChange={effects.setPowerState}
          value={state.powerState}
          simpleValue
          required
        />
      </FormGroup>
      <h3>{_('editBackupSmartPools')}</h3>
      <hr />
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartResidentOn')}</strong>
        </label>
        <SelectPool
          multi
          onChange={effects.setPoolValues}
          value={get(state.$pool, 'values')}
        />
      </FormGroup>
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartNotResidentOn')}</strong>
        </label>
        <SelectPool
          multi
          onChange={effects.setPoolNotValues}
          value={get(state.$pool, 'notValues')}
        />
      </FormGroup>
      <h3>{_('editBackupSmartTags')}</h3>
      <hr />
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartTagsTitle')}</strong>
        </label>
        <SelectTag
          multi
          onChange={effects.setTagValues}
          value={get(state.tags, 'values')}
        />
      </FormGroup>
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartExcludedTagsTitle')}</strong>
        </label>{' '}
        <Tooltip content={_('backupReplicatedVmsInfo')}>
          <Icon icon='info' />
        </Tooltip>
        <SelectTag
          multi
          onChange={effects.setTagNotValues}
          value={get(state.tags, 'notValues')}
        />
      </FormGroup>
      <SmartBackupPreview vms={vms} pattern={state.vmsSmartPattern} />
    </div>
  ),
])
