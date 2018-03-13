import _ from 'intl'
import ActionButton from 'action-button'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, resolveId, resolveIds } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Col, Row } from 'grid'
import { flatten, get, keyBy, isEmpty, map, some } from 'lodash'
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

const constructPattern = values => ({
  id: {
    __or: resolveIds(values),
  },
})

const destructPattern = pattern => pattern.id.__or

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

  for (const schedule in schedules) {
    newSettings[schedule] = {
      exportRetention: +schedules[schedule].exportRetention,
      snapshotRetention: +schedules[schedule].snapshotRetention,
    }
  }

  return newSettings
}

const getNewSchedules = schedules => {
  const newSchedules = {}

  for (const schedule in schedules) {
    newSchedules[schedule] = {
      cron: schedules[schedule].cron,
      timezone: schedules[schedule].timezone,
    }
  }

  return newSchedules
}

export default [
  New => props => (
    <Upgrade place='newBackup' required={2}>
      <New {...props} />
    </Upgrade>
  ),
  addSubscriptions({
    remotes: cb =>
      subscribeRemotes(remotes => {
        cb(keyBy(remotes, 'id'))
      }),
  }),
  provideState({
    initialState: () => ({
      $pool: {},
      backupMode: undefined,
      compression: true,
      crMode: undefined,
      deltaMode: undefined,
      drMode: undefined,
      editionMode: undefined,
      formId: getRandomId(),
      name: '',
      newSchedules: {},
      paramsUpdated: false,
      powerState: 'All',
      remotes: [],
      smartMode: false,
      snapshotMode: undefined,
      srs: [],
      tags: {},
      tmpSchedule: {},
      vms: [],
    }),
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
            (state.deltaMode || state.backupMode) &&
            constructPattern(state.remotes),
          srs: (state.crMode || state.drMode) && constructPattern(state.srs),
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
                exportRetention: +schedule.exportRetention,
                snapshotRetention: +schedule.snapshotRetention,
              }
            })
          )
        }

        await editBackupNgJob({
          id: props.job.id,
          name: state.name,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.compression ? 'native' : '',
          settings: {
            ...newSettings,
            ...props.job.settings,
          },
          remotes:
            (state.deltaMode || state.backupMode) &&
            constructPattern(state.remotes),
          srs: (state.crMode || state.drMode) && constructPattern(state.srs),
          vms: state.smartMode
            ? state.vmsSmartPattern
            : constructPattern(state.vms),
        })
      },
      setSnapshotMode: () => state => ({
        ...state,
        snapshotMode: !state.snapshotMode || undefined,
      }),
      setBackupMode: () => state => ({
        ...state,
        backupMode: !state.backupMode || undefined,
      }),
      setDeltaMode: () => state => ({
        ...state,
        deltaMode: !state.deltaMode || undefined,
      }),
      setDrMode: () => state => ({
        ...state,
        drMode: !state.drMode || undefined,
      }),
      setCrMode: () => state => ({
        ...state,
        crMode: !state.crMode || undefined,
      }),
      setCompression: (_, { target: { checked } }) => state => ({
        ...state,
        compression: checked,
      }),
      setSmartMode: (_, smartMode) => state => ({
        ...state,
        smartMode,
      }),
      setName: (_, { target: { value } }) => state => ({
        ...state,
        name: value,
      }),
      addRemote: (_, remote) => state => {
        const remotes = [...state.remotes]
        remotes.push(resolveId(remote))
        return {
          ...state,
          remotes,
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
      addSr: (_, sr) => state => {
        const srs = [...state.srs]
        srs.push(resolveId(sr))
        return {
          ...state,
          srs,
        }
      },
      deleteSr: (_, key) => state => {
        const srs = [...state.srs]
        srs.splice(key, 1)
        return {
          ...state,
          srs,
        }
      },
      setVms: (_, vms) => state => ({ ...state, vms }),
      updateParams: () => (state, { job }) => ({
        ...state,
        compression: job.compression === 'native',
        delta: job.mode === 'delta',
        name: job.name,
        paramsUpdated: true,
        smartMode: job.vms.id === undefined,
        snapshotMode:
          some(
            job.settings,
            ({ snapshotRetention }) => snapshotRetention > 0
          ) || undefined,
        backupMode: (job.mode === 'full' && !isEmpty(job.remotes)) || undefined,
        deltaMode: (job.mode === 'delta' && !isEmpty(job.remotes)) || undefined,
        drMode: (job.mode === 'full' && !isEmpty(job.srs)) || undefined,
        crMode: (job.mode === 'delta' && !isEmpty(job.srs)) || undefined,
        remotes: job.remotes !== undefined ? destructPattern(job.remotes) : [],
        srs: job.srs !== undefined ? destructPattern(job.srs) : [],
        ...destructVmsPattern(job.vms),
      }),
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
        await deleteSchedule(id)
        delete props.job.settings[id]
        await editBackupNgJob({
          id: props.job.id,
          settings: {
            ...props.job.settings,
          },
        })
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

        if (state.editionMode === 'editSchedule') {
          await editSchedule({
            id: state.tmpSchedule.id,
            jobId: props.job.id,
            cron,
            timezone,
          })
          await editBackupNgJob({
            id: props.job.id,
            settings: {
              ...props.job.settings,
              [state.tmpSchedule.id]: {
                exportRetention: +exportRetention,
                snapshotRetention: +snapshotRetention,
              },
            },
          })

          return {
            ...state,
            editionMode: undefined,
            tmpSchedule: {},
          }
        }

        return {
          ...state,
          editionMode: undefined,
          tmpSchedule: {},
          newSchedules: {
            ...state.newSchedules,
            [state.tmpSchedule.id]: {
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
    },
    computed: {
      needUpdateParams: (state, { job }) =>
        job !== undefined && !state.paramsUpdated,
      isJobInvalid: state =>
        state.name.trim() === '' ||
        (isEmpty(state.schedules) && isEmpty(state.newSchedules)) ||
        (isEmpty(state.vms) && !state.smartMode) ||
        ((state.backupMode || state.deltaMode) && isEmpty(state.remotes)) ||
        ((state.drMode || state.crMode) && isEmpty(state.srs)) ||
        (!state.isDelta && !state.isFull && !state.snapshotMode),
      showCompression: (state, { job }) =>
        state.isFull &&
        (some(
          state.newSchedules,
          schedule => +schedule.exportRetention !== 0
        ) ||
          (job &&
            some(job.settings, schedule => schedule.exportRetention !== 0))),
      exportMode: state =>
        state.backupMode || state.deltaMode || state.drMode || state.crMode,
      settings: (state, { job }) => get(job, 'settings') || {},
      schedules: (state, { schedules }) => schedules || [],
      isDelta: state => state.deltaMode || state.crMode,
      isFull: state => state.backupMode || state.drMode,
      allRemotes: (state, { remotes }) => remotes,
      vmsSmartPattern: ({ $pool, powerState, tags }) => ({
        $pool: constructSmartPattern($pool, resolveIds),
        power_state: powerState === 'All' ? undefined : powerState,
        tags: constructSmartPattern(tags, normaliseTagValues),
        type: 'VM',
      }),
    },
  }),
  injectState,
  ({ effects, state }) => {
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
                      onChange={effects.setSmartMode}
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
                  <div className='btn-toolbar text-xs-center'>
                    <ActionButton
                      active={state.snapshotMode}
                      handler={effects.setSnapshotMode}
                      icon='rolling-snapshot'
                    >
                      {_('rollingSnapshot')}
                    </ActionButton>
                    <ActionButton
                      active={state.backupMode}
                      disabled={state.isDelta}
                      handler={effects.setBackupMode}
                      icon='backup'
                    >
                      {_('backup')}
                    </ActionButton>
                    <ActionButton
                      active={state.deltaMode}
                      disabled={state.isFull}
                      handler={effects.setDeltaMode}
                      icon='delta-backup'
                    >
                      {_('deltaBackup')}
                    </ActionButton>
                    <ActionButton
                      active={state.drMode}
                      disabled={state.isDelta}
                      handler={effects.setDrMode}
                      icon='disaster-recovery'
                    >
                      {_('disasterRecovery')}
                    </ActionButton>
                    <ActionButton
                      active={state.crMode}
                      disabled={state.isFull}
                      handler={effects.setCrMode}
                      icon='continuous-replication'
                    >
                      {_('continuousReplication')}
                    </ActionButton>
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
                      <SelectRemote onChange={effects.addRemote} value={null} />
                      <br />
                      <Ul>
                        {map(state.remotes, (id, key) => (
                          <Li key={id}>
                            {state.allRemotes &&
                              renderXoItem({
                                type: 'remote',
                                value: state.allRemotes[id],
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
                      <SelectSr onChange={effects.addSr} value={null} />
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
                {_('scheduleEdit')}
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
                {_('createBackupJob')}
              </ActionButton>
            )}
          </Row>
        </Container>
      </form>
    )
  },
].reduceRight((value, decorator) => decorator(value))
