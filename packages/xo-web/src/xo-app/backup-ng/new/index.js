import _ from 'intl'
import ActionButton from 'action-button'
import defined, { get } from 'xo-defined'
import Icon from 'icon'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import Select from 'form/select'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { constructSmartPattern, destructSmartPattern } from 'smart-backup'
import { Container, Col, Row } from 'grid'
import { injectState, provideState } from '@julien-f/freactal'
import { SelectRemote, SelectSr, SelectVm } from 'select-objects'
import { Toggle } from 'form'
import {
  addSubscriptions,
  generateRandomId,
  resolveId,
  resolveIds,
} from 'utils'
import {
  cloneDeep,
  flatten,
  forEach,
  includes,
  isEmpty,
  keyBy,
  map,
  mapValues,
  some,
} from 'lodash'
import {
  createBackupNgJob,
  createSchedule,
  deleteSchedule,
  editBackupNgJob,
  editSchedule,
  isSrWritable,
  subscribeRemotes,
} from 'xo'

import Schedules from './schedules'
import SmartBackup from './smart-backup'
import { FormFeedback, FormGroup, Input, Number, Ul, Li } from './utils'

// ===================================================================

const REPORT_WHEN_FILTER_OPTIONS = [
  {
    label: 'reportWhenAlways',
    value: 'always',
  },
  {
    label: 'reportWhenFailure',
    value: 'failure',
  },
  {
    label: 'reportWhenNever',
    value: 'Never',
  },
]

const DEFAULT_VALUES = {
  // Modes
  backupMode: false,
  crMode: false,
  deltaMode: false,
  drMode: false,
  smartMode: false,
  snapshotMode: false,
  // Schedules
  schedules: {},
  settings: {},
  // Name
  compression: true,
  vms: [],
  name: '',
  // Smart mode
  $pool: {},
  powerState: 'All',
  tags: {},
  // Advanced settings
  concurrency: 0,
  offlineSnapshot: false,
  reportWhen: 'failure',
  // Targets
  remotes: [],
  srs: [],
}

const normalizeTagValues = values => resolveIds(values).map(value => [value])

const normalizeSettings = (
  settings,
  { copyMode, exportMode, snapshotMode }
) => {
  forEach(settings, setting => {
    if (!exportMode) {
      setting.exportRetention = undefined
    }

    if (!copyMode) {
      setting.copyRetention = undefined
    } else if (setting.copyRetention === undefined) {
      setting.copyRetention = setting.exportRetention
    }

    if (!snapshotMode) {
      setting.snapshotRetention = undefined
    }
  })
  return settings
}

const constructPattern = values =>
  values.length === 1
    ? {
        id: resolveId(values[0]),
      }
    : {
        id: {
          __or: resolveIds(values),
        },
      }

const destructPattern = pattern => pattern.id.__or || [pattern.id]

const getOptionRenderer = ({ label }) => <span>{_(label)}</span>

const createDoesRetentionExist = name => {
  const predicate = setting => setting[name] > 0
  return ({ computedSettings }) => some(computedSettings, predicate)
}

const createGetValue = (name, fn) => (state, props) =>
  defined(
    state[name],
    fn !== undefined ? get(fn, props) : props[name],
    DEFAULT_VALUES[name]
  )

const createGetGlobalSettingsValue = name =>
  createGetValue(name, ({ job }) => job.settings[''][name])

const createGetSelectValue = name =>
  createGetValue(name, ({ job }) => destructPattern(job[name]))

const initValues = () => {
  const values = {}
  for (const name in DEFAULT_VALUES) {
    values[name] = undefined
  }
  return values
}

const getInitialState = () => ({
  editionMode: undefined,
  formId: generateRandomId(),
  showErrors: false,
  tmpSchedule: {},
  ...initValues(),
})

export default [
  New => props => (
    <Upgrade place='newBackup' required={2}>
      <New {...props} />
    </Upgrade>
  ),
  addSubscriptions({
    remotesById: cb =>
      subscribeRemotes(remotes => {
        cb(keyBy(remotes, 'id'))
      }),
  }),
  provideState({
    initialState: getInitialState,
    effects: {
      createJob: () => async state => {
        if (state.isJobInvalid) {
          return {
            ...state,
            showErrors: true,
          }
        }

        await createBackupNgJob({
          name: state.computedName,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.computedCompression ? 'native' : '',
          schedules: mapValues(
            state.computedSchedules,
            ({ id, ...schedule }) => schedule
          ),
          settings: {
            ...normalizeSettings(cloneDeep(state.computedSettings), {
              exportMode: state.exportMode,
              copyMode: state.copyMode,
              snapshotMode: state.snapshotMode,
            }),
            '': {
              concurrency: state.computedConcurrency,
              offlineSnapshot: state.computedOfflineSnapshot,
              reportWhen: state.computedReportWhen,
            },
          },
          remotes:
            state.deltaMode || state.backupMode
              ? constructPattern(state.remotes)
              : undefined,
          srs:
            state.crMode || state.drMode
              ? constructPattern(state.srs)
              : undefined,
          vms: state.computedSmartMode
            ? state.vmsSmartPattern
            : constructPattern(state.computedVms),
        })
      },
      editJob: () => async (state, props) => {
        if (state.isJobInvalid) {
          return {
            ...state,
            showErrors: true,
          }
        }

        await Promise.all(
          map(props.schedules, oldSchedule => {
            const id = oldSchedule.id
            const newSchedule = state.computedSchedules[id]

            if (newSchedule === undefined) {
              return deleteSchedule(id)
            }

            if (
              newSchedule.cron !== oldSchedule.cron ||
              newSchedule.timezone !== oldSchedule.timezone
            ) {
              return editSchedule({
                id,
                cron: newSchedule.cron,
                timezone: newSchedule.timezone,
              })
            }
          })
        )

        const settings = cloneDeep(state.computedSettings)
        await Promise.all(
          map(state.computedSchedules, async newSchedule => {
            const tmpId = newSchedule.id
            if (props.schedules[tmpId] === undefined) {
              const { id } = await createSchedule(props.job.id, {
                cron: newSchedule.cron,
                timezone: newSchedule.timezone,
              })

              settings[id] = settings[tmpId]
              delete settings[tmpId]
            }
          })
        )

        await editBackupNgJob({
          id: props.job.id,
          name: state.computedName,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.computedCompression ? 'native' : '',
          settings: {
            ...normalizeSettings(settings, {
              exportMode: state.exportMode,
              copyMode: state.copyMode,
              snapshotMode: state.snapshotMode,
            }),
            '': {
              concurrency: state.computedConcurrency,
              offlineSnapshot: state.computedOfflineSnapshot,
              reportWhen: state.computedReportWhen,
            },
          },
          remotes:
            state.deltaMode || state.backupMode
              ? constructPattern(state.remotes)
              : constructPattern([]),
          srs:
            state.crMode || state.drMode
              ? constructPattern(state.srs)
              : constructPattern([]),
          vms: state.computedSmartMode
            ? state.vmsSmartPattern
            : constructPattern(state.computedVms),
        })
      },
      toggleMode: (_, { mode }) => state => ({
        ...state,
        [mode]: !state[mode],
      }),
      setCheckboxValue: (_, { target: { checked, name } }) => state => ({
        ...state,
        [name]: checked,
      }),
      toggleScheduleState: (_, id) => state => ({
        ...state,
        schedules: {
          ...state.schedules,
          [id]: {
            ...state.schedules[id],
            enabled: !state.schedules[id].enabled,
          },
        },
      }),
      toggleSmartMode: (_, smartMode) => state => ({
        ...state,
        smartMode,
      }),
      setName: (_, { target: { value } }) => state => ({
        ...state,
        name: value,
      }),
      addRemote: (_, remote) => state => {
        return {
          ...state,
          remotes: [...state.remotes, resolveId(remote)],
        }
      },
      deleteRemote: (_, key) => state => {
        const remotes = [...state.remotes]
        remotes.splice(key, 1)
        return {
          ...state,
          remotes,
        }
      },
      addSr: (_, sr) => state => ({
        ...state,
        srs: [...state.srs, resolveId(sr)],
      }),
      deleteSr: (_, key) => state => {
        const srs = [...state.srs]
        srs.splice(key, 1)
        return {
          ...state,
          srs,
        }
      },
      setVms: (_, vms) => state => ({ ...state, vms }),
      addSchedule: () => state => ({
        ...state,
        editionMode: 'creation',
      }),
      cancelSchedule: () => state => ({
        ...state,
        tmpSchedule: {},
        editionMode: undefined,
      }),
      editSchedule: (_, schedule) => state => ({
        ...state,
        editionMode: 'editSchedule',
        tmpSchedule: {
          ...schedule,
        },
      }),
      deleteSchedule: (_, schedule) => state => {
        const id = resolveId(schedule)
        const schedules = { ...state.computedSchedules }
        const settings = { ...state.computedSettings }

        delete schedules[id]
        delete settings[id]
        return {
          ...state,
          schedules,
          settings,
        }
      },
      saveSchedule: (
        _,
        { cron, timezone, exportRetention, copyRetention, snapshotRetention }
      ) => async state => {
        const id =
          state.editionMode === 'creation'
            ? generateRandomId()
            : state.tmpSchedule.id
        return {
          ...state,
          editionMode: undefined,
          schedules: {
            ...state.computedSchedules,
            [id]: {
              id,
              cron,
              timezone,
            },
          },
          settings: {
            ...state.computedSettings,
            [id]: {
              exportRetention,
              copyRetention,
              snapshotRetention,
            },
          },
          tmpSchedule: {},
        }
      },
      setPowerState: (_, powerState) => state => ({
        ...state,
        powerState,
      }),
      setPoolValues: (_, values) => state => ({
        ...state,
        $pool: {
          ...state.$pool,
          values,
        },
      }),
      setPoolNotValues: (_, notValues) => state => ({
        ...state,
        $pool: {
          ...state.$pool,
          notValues,
        },
      }),
      setTagValues: (_, values) => state => ({
        ...state,
        tags: {
          ...state.tags,
          values,
        },
      }),
      setTagNotValues: (_, notValues) => state => ({
        ...state,
        tags: {
          ...state.tags,
          notValues,
        },
      }),
      resetJob: ({ updateParams }) => (state, { job }) => {
        if (job !== undefined) {
          updateParams()
        }

        return getInitialState()
      },
      setReportWhen: (_, { value }) => state => ({
        ...state,
        reportWhen: value,
      }),
      setConcurrency: (_, concurrency) => state => ({
        ...state,
        concurrency,
      }),
    },
    computed: {
      isJobInvalid: state =>
        state.missingName ||
        state.missingVms ||
        state.missingBackupMode ||
        state.missingSchedules ||
        state.missingRemotes ||
        state.missingSrs ||
        state.missingExportRetention ||
        state.missingCopyRetention ||
        state.missingSnapshotRetention,
      missingName: state => state.name.trim() === '',
      missingVms: state =>
        !state.computedSmartMode && isEmpty(state.computedVms),
      missingBackupMode: state =>
        !state.isDelta && !state.isFull && !state.computedSnapshotMode,
      missingRemotes: state =>
        (state.computedBackupMode || state.computedDeltaMode) &&
        isEmpty(state.computedRemotes),
      missingSrs: state =>
        (state.computedDrMode || state.computedCrMode) &&
        isEmpty(state.computedSrs),
      missingSchedules: state => isEmpty(state.computedSchedules),
      missingExportRetention: state =>
        state.exportMode && !state.exportRetentionExists,
      missingCopyRetention: state =>
        state.copyMode &&
        !state.copyRetentionExists &&
        !state.exportRetentionExists,
      missingSnapshotRetention: state =>
        state.computedSnapshotMode && !state.snapshotRetentionExists,
      showCompression: state =>
        state.isFull &&
        (state.exportRetentionExists || state.copyRetentionExists),
      exportMode: state => state.computedBackupMode || state.computedDeltaMode,
      copyMode: state => state.computedDrMode || state.computedCrMode,
      exportRetentionExists: createDoesRetentionExist('exportRetention'),
      copyRetentionExists: createDoesRetentionExist('copyRetention'),
      snapshotRetentionExists: createDoesRetentionExist('snapshotRetention'),
      isDelta: state => state.computedDeltaMode || state.computedCrMode,
      isFull: state => state.computedBackupMode || state.computedDrMode,
      vmsSmartPattern: state => ({
        $pool: constructSmartPattern(state.computedPools, resolveIds),
        power_state: state.computedPowerState,
        tags: constructSmartPattern(state.computedTags, normalizeTagValues),
        type: 'VM',
      }),
      computedSchedules: createGetValue('schedules'),
      computedSettings: createGetValue('settings', ({ job }) => job.settings),
      computedSmartMode: createGetValue(
        'smartMode',
        ({ vms }) => vms.id === undefined
      ),
      computedVms: createGetSelectValue('vms'),
      computedRemotes: createGetSelectValue('remotes'),
      computedSrs: createGetSelectValue('srs'),
      computedPowerState: createGetValue(
        'powerState',
        ({ vms }) => vms.power_state
      ),
      computedPools: createGetValue('$pool', ({ vms }) =>
        destructSmartPattern(vms.$pool)
      ),
      computedTags: createGetValue('tags', ({ vms }) =>
        destructSmartPattern(vms.tags, flatten)
      ),
      computedConcurrency: createGetGlobalSettingsValue('concurrency'),
      computedOfflineSnapshot: createGetGlobalSettingsValue('offlineSnapshot'),
      computedReportWhen: createGetGlobalSettingsValue('reportWhen'),
      computedBackupMode: createGetValue(
        'backupMode',
        ({ mode, remotes }) =>
          mode === 'full' && !isEmpty(destructPattern(remotes))
      ),
      computedDeltaMode: createGetValue(
        'deltaMode',
        ({ mode, remotes }) =>
          mode === 'delta' && !isEmpty(destructPattern(remotes))
      ),
      computedDrMode: createGetValue(
        'drMode',
        ({ mode, srs }) => mode === 'full' && !isEmpty(destructPattern(srs))
      ),
      computedCrMode: createGetValue(
        'crMode',
        ({ mode, srs }) => mode === 'delta' && !isEmpty(destructPattern(srs))
      ),
      computedSnapshotMode: createGetValue('snapshotMode', ({ settings }) =>
        some(settings, ({ snapshotRetention }) => snapshotRetention > 0)
      ),
      computedCompression: createGetValue(
        'compression',
        ({ compression }) => compression === 'native'
      ),
      computedName: createGetValue('name'),
      srPredicate: ({ computedSrs }) => sr =>
        isSrWritable(sr) && !includes(computedSrs, sr.id),
      remotePredicate: ({ computedRemotes }) => ({ id }) =>
        !includes(computedRemotes, id),
    },
  }),
  injectState,
  ({ effects, state, ...props }) => (
    <form id={state.formId}>
      <Container>
        <Row>
          <Col mediumSize={6}>
            <Card>
              <CardHeader>
                {_('backupName')}*
                <Tooltip content={_('smartBackupModeTitle')}>
                  <Toggle
                    className='pull-right'
                    onChange={effects.toggleSmartMode}
                    value={state.computedSmartMode}
                    iconSize={1}
                  />
                </Tooltip>
              </CardHeader>
              <CardBlock>
                <FormGroup>
                  <label>
                    <strong>{_('backupName')}</strong>
                  </label>
                  <FormFeedback
                    component={Input}
                    message={_('missingBackupName')}
                    onChange={effects.setName}
                    error={state.showErrors ? state.missingName : undefined}
                    value={state.computedName}
                  />
                </FormGroup>
                {state.computedSmartMode ? (
                  <Upgrade place='newBackup' required={3}>
                    <SmartBackup />
                  </Upgrade>
                ) : (
                  <FormGroup>
                    <label>
                      <strong>{_('vmsToBackup')}</strong>
                    </label>
                    <FormFeedback
                      component={SelectVm}
                      message={_('missingVms')}
                      multi
                      onChange={effects.setVms}
                      error={state.showErrors ? state.missingVms : undefined}
                      value={state.computedVms}
                    />
                  </FormGroup>
                )}
                {state.showCompression && (
                  <label>
                    <input
                      checked={state.computedCompression}
                      name='compression'
                      onChange={effects.setCheckboxValue}
                      type='checkbox'
                    />{' '}
                    <strong>{_('useCompression')}</strong>
                  </label>
                )}
              </CardBlock>
            </Card>
            <FormFeedback
              component={Card}
              error={state.showErrors ? state.missingBackupMode : undefined}
              message={_('missingBackupMode')}
            >
              <CardBlock>
                <div className='text-xs-center'>
                  <ActionButton
                    active={state.computedSnapshotMode}
                    data-mode='snapshotMode'
                    handler={effects.toggleMode}
                    icon='rolling-snapshot'
                  >
                    {_('rollingSnapshot')}
                  </ActionButton>{' '}
                  <ActionButton
                    active={state.computedBackupMode}
                    data-mode='backupMode'
                    disabled={state.isDelta}
                    handler={effects.toggleMode}
                    icon='backup'
                  >
                    {_('backup')}
                  </ActionButton>{' '}
                  <ActionButton
                    active={state.computedDeltaMode}
                    data-mode='deltaMode'
                    disabled={
                      state.isFull ||
                      (!state.deltaMode && process.env.XOA_PLAN < 3)
                    }
                    handler={effects.toggleMode}
                    icon='delta-backup'
                  >
                    {_('deltaBackup')}
                  </ActionButton>{' '}
                  <ActionButton
                    active={state.computedDrMode}
                    data-mode='drMode'
                    disabled={
                      state.isDelta ||
                      (!state.drMode && process.env.XOA_PLAN < 3)
                    }
                    handler={effects.toggleMode}
                    icon='disaster-recovery'
                  >
                    {_('disasterRecovery')}
                  </ActionButton>{' '}
                  {process.env.XOA_PLAN < 3 && (
                    <Tooltip content={_('dbAndDrRequireEntreprisePlan')}>
                      <Icon icon='info' />
                    </Tooltip>
                  )}{' '}
                  <ActionButton
                    active={state.computedCrMode}
                    data-mode='crMode'
                    disabled={
                      state.isFull ||
                      (!state.crMode && process.env.XOA_PLAN < 4)
                    }
                    handler={effects.toggleMode}
                    icon='continuous-replication'
                  >
                    {_('continuousReplication')}
                  </ActionButton>{' '}
                  {process.env.XOA_PLAN < 4 && (
                    <Tooltip content={_('crRequiresPremiumPlan')}>
                      <Icon icon='info' />
                    </Tooltip>
                  )}
                </div>
              </CardBlock>
            </FormFeedback>
            <br />
            {(state.computedBackupMode || state.computedDeltaMode) && (
              <Card>
                <CardHeader>
                  {_(state.computedBackupMode ? 'backup' : 'deltaBackup')}
                </CardHeader>
                <CardBlock>
                  <FormGroup>
                    <label>
                      <strong>{_('backupTargetRemotes')}</strong>
                    </label>
                    <FormFeedback
                      component={SelectRemote}
                      message={_('missingRemotes')}
                      onChange={effects.addRemote}
                      predicate={state.remotePredicate}
                      error={
                        state.showErrors ? state.missingRemotes : undefined
                      }
                      value={null}
                    />
                    <br />
                    <Ul>
                      {map(state.computedRemotes, (id, key) => (
                        <Li key={id}>
                          {props.remotesById !== undefined &&
                            renderXoItem({
                              type: 'remote',
                              value: props.remotesById[id],
                            })}
                          <ActionButton
                            btnStyle='danger'
                            className='pull-right'
                            handler={effects.deleteRemote}
                            handlerParam={key}
                            icon='delete'
                            size='small'
                          />
                        </Li>
                      ))}
                    </Ul>
                  </FormGroup>
                </CardBlock>
              </Card>
            )}
            {(state.computedDrMode || state.computedCrMode) && (
              <Card>
                <CardHeader>
                  {_(
                    state.drMcomputedDrModeode
                      ? 'disasterRecovery'
                      : 'continuousReplication'
                  )}
                </CardHeader>
                <CardBlock>
                  <FormGroup>
                    <label>
                      <strong>{_('backupTargetSrs')}</strong>
                    </label>
                    <FormFeedback
                      component={SelectSr}
                      message={_('missingSrs')}
                      onChange={effects.addSr}
                      predicate={state.srPredicate}
                      error={state.showErrors ? state.missingSrs : undefined}
                      value={null}
                    />
                    <br />
                    <Ul>
                      {map(state.computedSrs, (id, key) => (
                        <Li key={id}>
                          {renderXoItemFromId(id)}
                          <ActionButton
                            btnStyle='danger'
                            className='pull-right'
                            icon='delete'
                            size='small'
                            handler={effects.deleteSr}
                            handlerParam={key}
                          />
                        </Li>
                      ))}
                    </Ul>
                  </FormGroup>
                </CardBlock>
              </Card>
            )}
            <Card>
              <CardHeader>{_('newBackupAdvancedSettings')}</CardHeader>
              <CardBlock>
                <FormGroup>
                  <label>
                    <strong>{_('reportWhen')}</strong>
                  </label>
                  <Select
                    labelKey='label'
                    onChange={effects.setReportWhen}
                    optionRenderer={getOptionRenderer}
                    options={REPORT_WHEN_FILTER_OPTIONS}
                    required
                    value={state.computedReportWhen}
                    valueKey='value'
                  />
                </FormGroup>
                <FormGroup>
                  <label>
                    <strong>{_('concurrency')}</strong>
                  </label>
                  <Number
                    onChange={effects.setConcurrency}
                    value={state.computedConcurrency}
                  />
                </FormGroup>
                <FormGroup>
                  <label>
                    <strong>{_('offlineSnapshot')}</strong>{' '}
                    <input
                      checked={state.computedOfflineSnapshot}
                      name='offlineSnapshot'
                      onChange={effects.setCheckboxValue}
                      type='checkbox'
                    />
                  </label>
                </FormGroup>
              </CardBlock>
            </Card>
          </Col>
          <Col mediumSize={6}>
            <Schedules />
          </Col>
        </Row>
        <Row>
          <Card>
            <CardBlock>
              {state.paramsUpdated ? (
                <ActionButton
                  btnStyle='primary'
                  form={state.formId}
                  handler={effects.editJob}
                  icon='save'
                  redirectOnSuccess={
                    state.isJobInvalid ? undefined : '/backup-ng'
                  }
                  size='large'
                >
                  {_('formSave')}
                </ActionButton>
              ) : (
                <ActionButton
                  btnStyle='primary'
                  form={state.formId}
                  handler={effects.createJob}
                  icon='save'
                  redirectOnSuccess={
                    state.isJobInvalid ? undefined : '/backup-ng'
                  }
                  size='large'
                >
                  {_('formCreate')}
                </ActionButton>
              )}
              <ActionButton
                handler={effects.resetJob}
                icon='undo'
                className='pull-right'
                size='large'
              >
                {_('formReset')}
              </ActionButton>
            </CardBlock>
          </Card>
        </Row>
      </Container>
    </form>
  ),
].reduceRight((value, decorator) => decorator(value))
