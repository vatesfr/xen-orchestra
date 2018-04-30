import _ from 'intl'
import ActionButton from 'action-button'
import Icon from 'icon'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, resolveId, resolveIds } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Col, Row } from 'grid'
import {
  find,
  findKey,
  flatten,
  keyBy,
  includes,
  isEmpty,
  map,
  some,
} from 'lodash'
import { injectState, provideState } from '@julien-f/freactal'
import { Toggle } from 'form'
import { constructSmartPattern, destructSmartPattern } from 'smart-backup'
import { SelectRemote, SelectSr, SelectVm } from 'select-objects'
import {
  createBackupNgJob,
  createSchedule,
  deleteSchedule,
  editBackupNgJob,
  editSchedule,
  subscribeRemotes,
} from 'xo'

import Schedules from './schedules'
import SmartBackup from './smart-backup'
import { FormGroup, getRandomId, Input, Ul, Li } from './utils'

// ===================================================================

const normaliseTagValues = values => resolveIds(values).map(value => [value])

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

const getNewSettings = schedules => {
  const newSettings = {}

  for (const id in schedules) {
    newSettings[id] = {
      exportRetention: schedules[id].exportRetention,
      snapshotRetention: schedules[id].snapshotRetention,
    }
  }

  return newSettings
}

const getNewSchedules = schedules => {
  const newSchedules = {}

  for (const id in schedules) {
    newSchedules[id] = {
      cron: schedules[id].cron,
      timezone: schedules[id].timezone,
    }
  }

  return newSchedules
}

const getInitialState = () => ({
  $pool: {},
  backupMode: false,
  compression: true,
  crMode: false,
  deltaMode: false,
  drMode: false,
  editionMode: undefined,
  formId: getRandomId(),
  name: '',
  newSchedules: {},
  paramsUpdated: false,
  powerState: 'All',
  remotes: [],
  schedules: [],
  settings: {},
  smartMode: false,
  snapshotMode: false,
  srs: [],
  tags: {},
  tmpSchedule: {},
  vms: [],
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
        await createBackupNgJob({
          name: state.name,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.compression ? 'native' : '',
          schedules: getNewSchedules(state.newSchedules),
          settings: {
            ...getNewSettings(state.newSchedules),
          },
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
        const newSettings = {}
        if (!isEmpty(state.newSchedules)) {
          await Promise.all(
            map(state.newSchedules, async schedule => {
              const scheduleId = (await createSchedule(props.job.id, {
                cron: schedule.cron,
                timezone: schedule.timezone,
              })).id
              newSettings[scheduleId] = {
                exportRetention: schedule.exportRetention,
                snapshotRetention: schedule.snapshotRetention,
              }
            })
          )
        }

        await Promise.all(
          map(props.schedules, oldSchedule => {
            const scheduleId = oldSchedule.id
            const newSchedule = find(state.schedules, { id: scheduleId })

            if (
              newSchedule !== undefined &&
              newSchedule.cron === oldSchedule.cron &&
              newSchedule.timezone === oldSchedule.timezone
            ) {
              return
            }

            if (newSchedule === undefined) {
              return deleteSchedule(scheduleId)
            }

            return editSchedule({
              id: scheduleId,
              jobId: props.job.id,
              cron: newSchedule.cron,
              timezone: newSchedule.timezone,
            })
          })
        )

        const oldSettings = props.job.settings
        const settings = state.settings
        for (const id in oldSettings) {
          const oldSetting = oldSettings[id]
          const newSetting = settings[id]

          if (!(id in settings)) {
            delete oldSettings[id]
          } else if (
            oldSetting.snapshotRetention !== newSetting.snapshotRetention ||
            oldSetting.exportRetention !== newSetting.exportRetention
          ) {
            newSettings[id] = {
              exportRetention: newSetting.exportRetention,
              snapshotRetention: newSetting.snapshotRetention,
            }
          }
        }

        await editBackupNgJob({
          id: props.job.id,
          name: state.name,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.compression ? 'native' : '',
          settings: {
            ...oldSettings,
            ...newSettings,
          },
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
      setCompression: (_, { target: { checked } }) => state => ({
        ...state,
        compression: checked,
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
      updateParams: () => (state, { job, schedules }) => {
        const remotes =
          job.remotes !== undefined ? destructPattern(job.remotes) : []
        const srs = job.srs !== undefined ? destructPattern(job.srs) : []

        return {
          ...state,
          compression: job.compression === 'native',
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
          settings: job.settings,
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
        tmpSchedule: {},
        editionMode: undefined,
      }),
      editSchedule: (_, schedule) => state => {
        const { snapshotRetention, exportRetention } =
          state.settings[schedule.id] || {}
        return {
          ...state,
          editionMode: 'editSchedule',
          tmpSchedule: {
            exportRetention,
            snapshotRetention,
            ...schedule,
          },
        }
      },
      deleteSchedule: (_, id) => async (state, props) => {
        const schedules = [...state.schedules]
        schedules.splice(findKey(state.schedules, { id }), 1)

        return {
          ...state,
          schedules,
        }
      },
      editNewSchedule: (_, schedule) => state => ({
        ...state,
        editionMode: 'editNewSchedule',
        tmpSchedule: {
          ...schedule,
        },
      }),
      deleteNewSchedule: (_, id) => async (state, props) => {
        const newSchedules = { ...state.newSchedules }
        delete newSchedules[id]
        return {
          ...state,
          newSchedules,
        }
      },
      saveSchedule: (
        _,
        { cron, timezone, exportRetention, snapshotRetention }
      ) => async (state, props) => {
        if (!state.exportMode) {
          exportRetention = 0
        }
        if (!state.snapshotMode) {
          snapshotRetention = 0
        }

        if (state.editionMode === 'creation') {
          return {
            ...state,
            editionMode: undefined,
            newSchedules: {
              ...state.newSchedules,
              [getRandomId()]: {
                cron,
                timezone,
                exportRetention,
                snapshotRetention,
              },
            },
          }
        }

        const id = state.tmpSchedule.id
        if (state.editionMode === 'editSchedule') {
          const scheduleKey = findKey(state.schedules, { id })
          const schedules = [...state.schedules]
          schedules[scheduleKey] = {
            ...schedules[scheduleKey],
            cron,
            timezone,
          }

          const settings = { ...state.settings }
          settings[id] = {
            exportRetention,
            snapshotRetention,
          }

          return {
            ...state,
            editionMode: undefined,
            schedules,
            settings,
            tmpSchedule: {},
          }
        }

        return {
          ...state,
          editionMode: undefined,
          tmpSchedule: {},
          newSchedules: {
            ...state.newSchedules,
            [id]: {
              cron,
              timezone,
              exportRetention,
              snapshotRetention,
            },
          },
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
    },
    computed: {
      needUpdateParams: (state, { job, schedules }) =>
        job !== undefined && schedules !== undefined && !state.paramsUpdated,
      isJobInvalid: state =>
        state.name.trim() === '' ||
        (isEmpty(state.schedules) && isEmpty(state.newSchedules)) ||
        (isEmpty(state.vms) && !state.smartMode) ||
        ((state.backupMode || state.deltaMode) && isEmpty(state.remotes)) ||
        ((state.drMode || state.crMode) && isEmpty(state.srs)) ||
        (state.exportMode && !state.exportRetentionExists) ||
        (state.snapshotMode && !state.snapshotRetentionExists) ||
        (!state.isDelta && !state.isFull && !state.snapshotMode),
      showCompression: state => state.isFull && state.exportRetentionExists,
      exportMode: state =>
        state.backupMode || state.deltaMode || state.drMode || state.crMode,
      exportRetentionExists: ({ newSchedules, settings }) =>
        some(
          { ...newSchedules, ...settings },
          ({ exportRetention }) => exportRetention !== 0
        ),
      snapshotRetentionExists: ({ newSchedules, settings }) =>
        some(
          { ...newSchedules, ...settings },
          ({ snapshotRetention }) => snapshotRetention !== 0
        ),
      isDelta: state => state.deltaMode || state.crMode,
      isFull: state => state.backupMode || state.drMode,
      vmsSmartPattern: ({ $pool, powerState, tags }) => ({
        $pool: constructSmartPattern($pool, resolveIds),
        power_state: powerState === 'All' ? undefined : powerState,
        tags: constructSmartPattern(tags, normaliseTagValues),
        type: 'VM',
      }),
      srPredicate: ({ srs }) => ({ id }) => !includes(srs, id),
      remotePredicate: ({ remotes }) => ({ id }) => !includes(remotes, id),
    },
  }),
  injectState,
  ({ effects, remotesById, state }) => {
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
                  {_('backupName')}
                  <Tooltip content={_('smartBackupModeTitle')}>
                    <Toggle
                      className='pull-right'
                      onChange={effects.toggleSmartMode}
                      value={state.smartMode}
                      iconSize={1}
                    />
                  </Tooltip>
                </CardHeader>
                <CardBlock>
                  <FormGroup>
                    <label>
                      <strong>{_('backupName')}</strong>
                    </label>
                    <Input onChange={effects.setName} value={state.name} />
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
                      <SelectVm
                        multi
                        onChange={effects.setVms}
                        value={state.vms}
                      />
                    </FormGroup>
                  )}
                  {state.showCompression && (
                    <label>
                      <input
                        type='checkbox'
                        onChange={effects.setCompression}
                        checked={state.compression}
                      />{' '}
                      <strong>{_('useCompression')}</strong>
                    </label>
                  )}
                </CardBlock>
              </Card>
              <Card>
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
              </Card>
              {(state.backupMode || state.deltaMode) && (
                <Card>
                  <CardHeader>
                    {_(state.backupMode ? 'backup' : 'deltaBackup')}
                  </CardHeader>
                  <CardBlock>
                    <FormGroup>
                      <label>
                        <strong>{_('backupTargetRemotes')}</strong>
                      </label>
                      <SelectRemote
                        onChange={effects.addRemote}
                        predicate={state.remotePredicate}
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
                      <SelectSr
                        onChange={effects.addSr}
                        predicate={state.srPredicate}
                        value={null}
                      />
                      <br />
                      <Ul>
                        {map(state.srs, (id, key) => (
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
                    disabled={state.isJobInvalid}
                    form={state.formId}
                    handler={effects.editJob}
                    icon='save'
                    redirectOnSuccess='/backup-ng'
                    size='large'
                  >
                    {_('formSave')}
                  </ActionButton>
                ) : (
                  <ActionButton
                    btnStyle='primary'
                    disabled={state.isJobInvalid}
                    form={state.formId}
                    handler={effects.createJob}
                    icon='save'
                    redirectOnSuccess='/backup-ng'
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
