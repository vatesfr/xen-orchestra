import _ from 'intl'
import React from 'react'
import SmartBackupPreview from 'smart-backup'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { injectState } from '@julien-f/freactal'
import { Select } from 'form'
import { SelectPool, SelectTag } from 'select-objects'

import { FormGroup } from './utils'

const VMS_STATUSES_OPTIONS = [
  { value: 'All', label: _('vmStateAll') },
  { value: 'Running', label: _('vmStateRunning') },
  { value: 'Halted', label: _('vmStateHalted') },
]

export default [
  connectStore({
    vms: createGetObjectsOfType('VM'),
  }),
  injectState,
  ({ state, effects, ...props }) => (
    <div>
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartStatusTitle')}</strong>
        </label>
        <Select
          options={VMS_STATUSES_OPTIONS}
          onChange={effects.setPowerState}
          value={state.computedPowerState}
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
          value={state.computedPools.values}
        />
      </FormGroup>
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartNotResidentOn')}</strong>
        </label>
        <SelectPool
          multi
          onChange={effects.setPoolNotValues}
          value={state.computedPools.notValues}
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
          value={state.computedTags.values}
        />
      </FormGroup>
      <FormGroup>
        <label>
          <strong>{_('editBackupSmartExcludedTagsTitle')}</strong>
        </label>
        <SelectTag
          multi
          onChange={effects.setTagNotValues}
          value={state.computedTags.notValues}
        />
      </FormGroup>
      <SmartBackupPreview vms={props.vms} pattern={state.vmsSmartPattern} />
    </div>
  ),
].reduceRight((value, decorator) => decorator(value))
