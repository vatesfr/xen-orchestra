import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SmartBackupPreview, {
  constructSmartPattern,
  destructSmartPattern,
} from 'smart-backup'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore, resolveIds } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { flatten } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { Select } from 'form'
import { SelectPool, SelectTag, SelectVm } from 'select-objects'

import {
  constructPattern as constructSimplePattern,
  destructPattern as destructSimplePattern,
  FormFeedback,
  FormGroup,
  getValue,
  ThinProvisionedTip,
} from './../utils'

const VMS_STATUSES_OPTIONS = [
  { value: 'All', label: _('vmStateAll') },
  { value: 'Running', label: _('vmStateRunning') },
  { value: 'Halted', label: _('vmStateHalted') },
]

const DEFAULT_POWER_STATE = 'All'
const DEFAULT_SKIPPED_TAGS = ['Continuous Replication', 'Disaster Recovery']

export default decorate([
  connectStore({
    vms: createGetObjectsOfType('VM'),
  }),
  provideState({
    initialState: () => ({
      _smartMode: undefined,
      _vms: undefined,
      _powerState: undefined,
      _pools: undefined,
      _skippedPools: undefined,
      _tags: undefined,
      _skippedTags: undefined,
    }),
    effects: {
      toggleSmartMode () {
        const { effects, state } = this
        state._smartMode = !state._smartMode
        effects.notifyParent()
      },
      setVms (_, vms) {
        const { effects, state } = this
        state._vms = vms
        effects.notifyParent()
      },
      setPowerState (_, powerState) {
        const { effects, state } = this
        state._powerState = powerState
        effects.notifyParent()
      },
      setPools (_, pools) {
        const { effects, state } = this
        state._pools = pools
        effects.notifyParent()
      },
      setSkippedPools (_, skippedPools) {
        const { effects, state } = this
        state._skippedPools = skippedPools
        effects.notifyParent()
      },
      setTags (_, tags) {
        const { effects, state } = this
        state._tags = tags
        effects.notifyParent()
      },
      setSkippedTags (_, skippedTags) {
        const { effects, state } = this
        state._skippedTags = skippedTags
        effects.notifyParent()
      },
      notifyParent: () => (state, props) => {
        props.onChange(state.pattern, state.missingVms)
      },
    },
    computed: {
      smartMode: getValue(
        '_smartMode',
        ({ pattern }) => pattern.id === undefined
      ),
      vms: getValue(
        '_vms',
        ({ pattern }) => destructSimplePattern(pattern),
        []
      ),
      powerState: getValue(
        '_powerState',
        ({ pattern }) => pattern.power_state,
        DEFAULT_POWER_STATE
      ),
      destructedPoolsPattern: (_, { pattern = {} }) =>
        destructSmartPattern(pattern.$pool),
      pools: getValue(
        '_pools',
        (_, { destructedPoolsPattern }) => destructedPoolsPattern.values,
        []
      ),
      skippedPools: getValue(
        '_skippedPools',
        (_, { destructedPoolsPattern }) => destructedPoolsPattern.notValues,
        []
      ),
      destructedTagsPattern: (_, { pattern = {} }) =>
        destructSmartPattern(pattern.tags, flatten),
      tags: getValue(
        '_tags',
        (_, { destructedTagsPattern }) => destructedTagsPattern.values,
        []
      ),
      skippedTags: getValue(
        '_skippedTags',
        (_, { destructedTagsPattern }) => destructedTagsPattern.notValues,
        DEFAULT_SKIPPED_TAGS
      ),
      pattern: state =>
        !state.smartMode
          ? constructSimplePattern(state.vms)
          : {
              type: 'VM',
              power_state:
                state.powerState === 'All' ? undefined : state.powerState,
              $pool: constructSmartPattern(
                {
                  values: state.pools,
                  notValues: state.skippedPools,
                },
                resolveIds
              ),
              tags: constructSmartPattern(
                {
                  values: state.tags,
                  notValues: state.skippedTags,
                },
                values => resolveIds(values).map(value => [value])
              ),
            },
      missingVms: state => !state.smartMode && state.vms.length === 0,
    },
  }),
  injectState,
  ({ state, effects, showErrors, vms }) => (
    <Card>
      <CardHeader>
        {_('vmsToBackup')}*{' '}
        <ThinProvisionedTip label='vmsOnThinProvisionedSrTip' />
        <ActionButton
          className='pull-right'
          handler={effects.toggleSmartMode}
          icon={state.smartMode ? 'toggle-on' : 'toggle-off'}
          iconColor={state.smartMode ? 'text-success' : undefined}
          size='small'
        >
          {_('smartBackupModeTitle')}
        </ActionButton>
      </CardHeader>
      <CardBlock>
        {!state.smartMode ? (
          <FormFeedback
            component={SelectVm}
            error={state.showErrors ? state.missingVms : undefined}
            message={_('missingVms')}
            multi
            onChange={effects.setVms}
            value={state.vms}
          />
        ) : (
          <Upgrade place='newBackup' required={3}>
            <div>
              <FormGroup>
                <label>
                  <strong>{_('editBackupSmartStatusTitle')}</strong>
                </label>
                <Select
                  onChange={effects.setPowerState}
                  options={VMS_STATUSES_OPTIONS}
                  required
                  simpleValue
                  value={state.powerState}
                />
                <br />
                <h3>{_('editBackupSmartPools')}</h3>
                <hr />
              </FormGroup>
              <FormGroup>
                <label>
                  <strong>{_('editBackupSmartResidentOn')}</strong>
                </label>
                <SelectPool
                  multi
                  onChange={effects.setPools}
                  value={state.pools}
                />
              </FormGroup>
              <FormGroup>
                <label>
                  <strong>{_('editBackupSmartNotResidentOn')}</strong>
                </label>
                <SelectPool
                  multi
                  onChange={effects.setSkippedPools}
                  value={state.skippedPools}
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
                  onChange={effects.setTags}
                  value={state.tags}
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
                  onChange={effects.setSkippedTags}
                  value={state.skippedTags}
                />
              </FormGroup>
              <SmartBackupPreview vms={vms} pattern={state.pattern} />
            </div>
          </Upgrade>
        )}
      </CardBlock>
    </Card>
  ),
])
