import _ from 'intl'
import ActionButton from 'action-button'
import defined, { get } from 'xo-defined'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import Select from 'form/select'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { constructSmartPattern, destructSmartPattern } from 'smart-backup'
import { Container, Col, Row } from 'grid'
import { flatten, includes, isEmpty, keyBy, map, mapValues, some } from 'lodash'
import { injectState, provideState } from '@julien-f/freactal'
import { Map } from 'immutable'
import { Number } from 'form'
import { SelectRemote, SelectSr, SelectVm } from 'select-objects'
import {
  addSubscriptions,
  generateRandomId,
  resolveId,
  resolveIds,
} from 'utils'
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
import {
  destructPattern,
  FormFeedback,
  FormGroup,
  Input,
  Li,
  Ul,
} from './../utils'

// ===================================================================

const normalizeTagValues = values => resolveIds(values).map(value => [value])

const normalizeSettings = ({ settings, exportMode, copyMode, snapshotMode }) =>
  settings.map(
    setting =>
      defined(
        setting.copyRetention,
        setting.exportRetention,
        setting.snapshotRetention
      ) !== undefined
        ? {
            copyRetention: copyMode ? setting.copyRetention : undefined,
            exportRetention: exportMode ? setting.exportRetention : undefined,
            snapshotRetention: snapshotMode
              ? setting.snapshotRetention
              : undefined,
          }
        : setting
  )

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

const destructVmsPattern = pattern =>
  pattern.id === undefined
    ? {
        powerState: pattern.power_state || 'All',
        $pool: destructSmartPattern(pattern.$pool),
        tags: destructSmartPattern(pattern.tags, flatten),
      }
    : {
        vms: destructPattern(pattern),
      }

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

const getOptionRenderer = ({ label }) => <span>{_(label)}</span>

const createDoesRetentionExist = name => {
  const predicate = setting => setting[name] > 0
  return ({ propSettings, settings = propSettings }) => settings.some(predicate)
}

const getInitialState = () => ({
  $pool: {},
  backupMode: false,
  compression: undefined,
  crMode: false,
  deltaMode: false,
  drMode: false,
  editionMode: undefined,
  formId: generateRandomId(),
  inputConcurrencyId: generateRandomId(),
  inputReportWhenId: generateRandomId(),
  inputTimeoutId: generateRandomId(),
  name: '',
  paramsUpdated: false,
  powerState: 'All',
  remotes: [],
  schedules: {},
  settings: undefined,
  showErrors: false,
  smartMode: false,
  snapshotMode: false,
  srs: [],
  tags: {},
  tmpSchedule: undefined,
  vms: [],
})

const DeleteOldBackupsFirst = ({ handler, handlerParam, value }) => (
  <ActionButton
    handler={handler}
    handlerParam={handlerParam}
    icon={value ? 'toggle-on' : 'toggle-off'}
    iconColor={value ? 'text-success' : undefined}
    size='small'
    tooltip={_('deleteOldBackupsFirstMessage')}
  >
    {_('deleteOldBackupsFirst')}
  </ActionButton>
)

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
          name: state.name,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.compression ? 'native' : '',
          schedules: mapValues(
            state.schedules,
            ({ id, ...schedule }) => schedule
          ),
          settings: normalizeSettings({
            settings: state.settings,
            exportMode: state.exportMode,
            copyMode: state.copyMode,
            snapshotMode: state.snapshotMode,
          }).toObject(),
          remotes:
            state.deltaMode || state.backupMode
              ? constructPattern(state.remotes)
              : undefined,
          srs:
            state.crMode || state.drMode
              ? constructPattern(state.srs)
              : undefined,
          vms: state.smartMode
            ? state.vmsSmartPattern
            : constructPattern(state.vms),
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
            const newSchedule = state.schedules[id]

            if (newSchedule === undefined) {
              return deleteSchedule(id)
            }

            if (
              newSchedule.cron !== oldSchedule.cron ||
              newSchedule.name !== oldSchedule.name ||
              newSchedule.timezone !== oldSchedule.timezone ||
              newSchedule.enabled !== oldSchedule.enabled
            ) {
              return editSchedule({
                id,
                cron: newSchedule.cron,
                name: newSchedule.name,
                timezone: newSchedule.timezone,
                enabled: newSchedule.enabled,
              })
            }
          })
        )

        let settings = state.settings
        await Promise.all(
          map(state.schedules, async schedule => {
            const tmpId = schedule.id
            if (props.schedules[tmpId] === undefined) {
              const { id } = await createSchedule(props.job.id, {
                cron: schedule.cron,
                name: schedule.name,
                timezone: schedule.timezone,
                enabled: schedule.enabled,
              })

              settings = settings.withMutations(settings => {
                settings.set(id, settings.get(tmpId))
                settings.delete(tmpId)
              })
            }
          })
        )

        await editBackupNgJob({
          id: props.job.id,
          name: state.name,
          mode: state.isDelta ? 'delta' : 'full',
          compression:
            state.compression === undefined
              ? undefined
              : state.compression
                ? 'native'
                : '',
          settings: normalizeSettings({
            settings: settings || state.propSettings,
            exportMode: state.exportMode,
            copyMode: state.copyMode,
            snapshotMode: state.snapshotMode,
          }).toObject(),
          remotes:
            state.deltaMode || state.backupMode
              ? constructPattern(state.remotes)
              : constructPattern([]),
          srs:
            state.crMode || state.drMode
              ? constructPattern(state.srs)
              : constructPattern([]),
          vms: state.smartMode
            ? state.vmsSmartPattern
            : constructPattern(state.vms),
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
      setName: (_, { target: { value } }) => state => ({
        ...state,
        name: value,
      }),
      setTargetDeleteFirst: (_, id) => ({
        propSettings,
        settings = propSettings,
      }) => ({
        settings: settings.set(id, {
          deleteFirst: !settings.getIn([id, 'deleteFirst']),
        }),
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
      updateParams: () => (_, { job, schedules }) => {
        const remotes =
          job.remotes !== undefined ? destructPattern(job.remotes) : []
        const srs = job.srs !== undefined ? destructPattern(job.srs) : []

        return {
          name: job.name,
          paramsUpdated: true,
          smartMode: job.vms.id === undefined,
          snapshotMode: some(
            job.settings,
            ({ snapshotRetention }) => snapshotRetention > 0
          ),
          backupMode: job.mode === 'full' && !isEmpty(remotes),
          deltaMode: job.mode === 'delta' && !isEmpty(remotes),
          drMode: job.mode === 'full' && !isEmpty(srs),
          crMode: job.mode === 'delta' && !isEmpty(srs),
          remotes,
          srs,
          schedules,
          ...destructVmsPattern(job.vms),
        }
      },
      addSchedule: () => state => ({
        ...state,
        editionMode: 'creation',
      }),
      cancelSchedule: () => state => ({
        ...state,
        tmpSchedule: undefined,
        editionMode: undefined,
      }),
      editSchedule: (_, schedule) => state => ({
        ...state,
        editionMode: 'editSchedule',
        tmpSchedule: {
          ...schedule,
        },
      }),
      deleteSchedule: (_, schedule) => ({
        schedules: oldSchedules,
        propSettings,
        settings = propSettings,
      }) => {
        const id = resolveId(schedule)
        const schedules = { ...oldSchedules }
        delete schedules[id]
        return {
          schedules,
          settings: settings.delete(id),
        }
      },
      saveSchedule: (_, { cron, timezone, name, ...setting }) => ({
        editionMode,
        propSettings,
        schedules: oldSchedules,
        settings = propSettings,
        tmpSchedule,
      }) => {
        if (editionMode === 'creation') {
          const id = generateRandomId()
          return {
            editionMode: undefined,
            schedules: {
              ...oldSchedules,
              [id]: {
                cron,
                id,
                name,
                timezone,
              },
            },
            settings: settings.set(id, setting),
          }
        }

        const id = tmpSchedule.id
        const schedules = { ...oldSchedules }

        schedules[id] = {
          ...schedules[id],
          cron,
          name,
          timezone,
        }

        return {
          editionMode: undefined,
          schedules,
          settings: settings.set(id, setting),
          tmpSchedule: undefined,
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
      setGlobalSettings: (_, { name, value }) => ({
        propSettings,
        settings = propSettings,
      }) => ({
        settings: settings.update('', setting => ({
          ...setting,
          [name]: value,
        })),
      }),
      setReportWhen: ({ setGlobalSettings }, { value }) => () => {
        setGlobalSettings({
          name: 'reportWhen',
          value,
        })
      },
      setConcurrency: ({ setGlobalSettings }, value) => () => {
        setGlobalSettings({
          name: 'concurrency',
          value,
        })
      },
      setTimeout: ({ setGlobalSettings }, value) => () => {
        setGlobalSettings({
          name: 'timeout',
          value: value && value * 1e3,
        })
      },
      setOfflineSnapshot: (
        { setGlobalSettings },
        { target: { checked: value } }
      ) => () => {
        setGlobalSettings({
          name: 'offlineSnapshot',
          value,
        })
      },
    },
    computed: {
      needUpdateParams: (state, { job, schedules }) =>
        job !== undefined && schedules !== undefined && !state.paramsUpdated,
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
      missingVms: state => isEmpty(state.vms) && !state.smartMode,
      missingBackupMode: state =>
        !state.isDelta && !state.isFull && !state.snapshotMode,
      missingRemotes: state =>
        (state.backupMode || state.deltaMode) && isEmpty(state.remotes),
      missingSrs: state => (state.drMode || state.crMode) && isEmpty(state.srs),
      missingSchedules: state => isEmpty(state.schedules),
      missingExportRetention: state =>
        state.exportMode && !state.exportRetentionExists,
      missingCopyRetention: state =>
        state.copyMode && !state.copyRetentionExists,
      missingSnapshotRetention: state =>
        state.snapshotMode && !state.snapshotRetentionExists,
      showCompression: state =>
        state.isFull &&
        (state.exportRetentionExists || state.copyRetentionExists),
      exportMode: state => state.backupMode || state.deltaMode,
      copyMode: state => state.drMode || state.crMode,
      exportRetentionExists: createDoesRetentionExist('exportRetention'),
      copyRetentionExists: createDoesRetentionExist('copyRetention'),
      snapshotRetentionExists: createDoesRetentionExist('snapshotRetention'),
      isDelta: state => state.deltaMode || state.crMode,
      isFull: state => state.backupMode || state.drMode,
      vmsSmartPattern: ({ $pool, powerState, tags }) => ({
        $pool: constructSmartPattern($pool, resolveIds),
        power_state: powerState === 'All' ? undefined : powerState,
        tags: constructSmartPattern(tags, normalizeTagValues),
        type: 'VM',
      }),
      srPredicate: ({ srs }) => sr => isSrWritable(sr) && !includes(srs, sr.id),
      remotePredicate: ({ remotes }) => ({ id }) => !includes(remotes, id),
      propSettings: (_, { job }) => Map(get(() => job.settings)),
    },
  }),
  injectState,
  ({ state, effects, remotesById, job = {} }) => {
    const { propSettings, settings = propSettings } = state
    const { concurrency, reportWhen = 'failure', offlineSnapshot, timeout } =
      settings.get('') || {}

    const { compression = job.compression === 'native' } = state

    if (state.needUpdateParams) {
      effects.updateParams()
    }

    return (
      <form id={state.formId}>
        <Container>
          <Row>
            <Col mediumSize={6}>
              <Card>
                <CardHeader>
                  {_('backupName')}*
                  <ActionButton
                    className='pull-right'
                    data-mode='smartMode'
                    handler={effects.toggleMode}
                    icon={state.smartMode ? 'toggle-on' : 'toggle-off'}
                    iconColor={state.smartMode ? 'text-success' : undefined}
                    size='small'
                  >
                    {_('smartBackupModeTitle')}
                  </ActionButton>
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
                      value={state.name}
                    />
                  </FormGroup>
                  {state.smartMode ? (
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
                        value={state.vms}
                      />
                    </FormGroup>
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
                      active={state.snapshotMode}
                      data-mode='snapshotMode'
                      handler={effects.toggleMode}
                      icon='rolling-snapshot'
                    >
                      {_('rollingSnapshot')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.backupMode}
                      data-mode='backupMode'
                      disabled={state.isDelta}
                      handler={effects.toggleMode}
                      icon='backup'
                    >
                      {_('backup')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.deltaMode}
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
                      active={state.drMode}
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
                      active={state.crMode}
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
              {(state.backupMode || state.deltaMode) && (
                <Card>
                  <CardHeader>
                    {_(state.backupMode ? 'backup' : 'deltaBackup')}
                    <Link
                      className='btn btn-primary pull-right'
                      target='_blank'
                      to='/settings/remotes'
                    >
                      <Icon icon='settings' />{' '}
                      <strong>{_('remotesSettings')}</strong>
                    </Link>
                  </CardHeader>
                  <CardBlock>
                    {isEmpty(remotesById) ? (
                      <span className='text-warning'>
                        <Icon icon='alarm' /> {_('createRemoteMessage')}
                      </span>
                    ) : (
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
                          {map(state.remotes, (id, key) => (
                            <Li key={id}>
                              {remotesById !== undefined &&
                                renderXoItem({
                                  type: 'remote',
                                  value: remotesById[id],
                                })}
                              <div className='pull-right'>
                                <DeleteOldBackupsFirst
                                  handler={effects.setTargetDeleteFirst}
                                  handlerParam={id}
                                  value={settings.getIn([id, 'deleteFirst'])}
                                />{' '}
                                <ActionButton
                                  btnStyle='danger'
                                  handler={effects.deleteRemote}
                                  handlerParam={key}
                                  icon='delete'
                                  size='small'
                                />
                              </div>
                            </Li>
                          ))}
                        </Ul>
                      </FormGroup>
                    )}
                  </CardBlock>
                </Card>
              )}
              {(state.drMode || state.crMode) && (
                <Card>
                  <CardHeader>
                    {_(
                      state.drMode
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
                        {map(state.srs, (id, key) => (
                          <Li key={id}>
                            {renderXoItemFromId(id)}
                            <div className='pull-right'>
                              <DeleteOldBackupsFirst
                                handler={effects.setTargetDeleteFirst}
                                handlerParam={id}
                                value={settings.getIn([id, 'deleteFirst'])}
                              />{' '}
                              <ActionButton
                                btnStyle='danger'
                                icon='delete'
                                size='small'
                                handler={effects.deleteSr}
                                handlerParam={key}
                              />
                            </div>
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
                    <label htmlFor={state.inputReportWhenId}>
                      <strong>{_('reportWhen')}</strong>
                    </label>
                    <Select
                      id={state.inputReportWhenId}
                      labelKey='label'
                      onChange={effects.setReportWhen}
                      optionRenderer={getOptionRenderer}
                      options={REPORT_WHEN_FILTER_OPTIONS}
                      required
                      value={reportWhen}
                      valueKey='value'
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor={state.inputConcurrencyId}>
                      <strong>{_('concurrency')}</strong>
                    </label>
                    <Number
                      id={state.inputConcurrencyId}
                      onChange={effects.setConcurrency}
                      value={concurrency}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor={state.inputTimeoutId}>
                      <strong>{_('timeout')}</strong>
                    </label>{' '}
                    <Tooltip content={_('timeoutInfo')}>
                      <Icon icon='info' />
                    </Tooltip>
                    <Number
                      id={state.inputTimeoutId}
                      onChange={effects.setTimeout}
                      value={timeout && timeout / 1e3}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>
                      <strong>{_('offlineSnapshot')}</strong>{' '}
                      <Tooltip content={_('offlineSnapshotInfo')}>
                        <Icon icon='info' />
                      </Tooltip>{' '}
                      <input
                        checked={offlineSnapshot}
                        onChange={effects.setOfflineSnapshot}
                        type='checkbox'
                      />
                    </label>
                  </FormGroup>
                  {state.showCompression && (
                    <FormGroup>
                      <label>
                        <strong>{_('useCompression')}</strong>{' '}
                        <input
                          checked={compression}
                          name='compression'
                          onChange={effects.setCheckboxValue}
                          type='checkbox'
                        />
                      </label>
                    </FormGroup>
                  )}
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
    )
  },
].reduceRight((value, decorator) => decorator(value))
