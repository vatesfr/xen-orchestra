import _ from 'intl'
import ActionButton from 'action-button'
import React from 'react'
import SmartBackupPreview from 'smart-backup-preview'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore, resolveIds } from 'utils'
import { Container, Col, Row } from 'grid'
import {
  constructSmartPattern,
  destructSmartPattern,
} from 'smart-backup-pattern'
import { createGetObjectsOfType } from 'selectors'
import { injectState, provideState } from '@julien-f/freactal'
import { Select, Toggle } from 'form'
import { flatten, get, isEmpty, map, some } from 'lodash'
import {
  SelectPool,
  SelectRemote,
  SelectSr,
  SelectTag,
  SelectVm,
} from 'select-objects'
import {
  createBackupNgJob,
  createSchedule,
  deleteSchedule,
  editBackupNgJob,
  editSchedule,
} from 'xo'

import Schedules from './schedules'
import { FormGroup, Input } from './form'

// ===================================================================

const SMART_MODE_INITIAL_STATE = {
  powerState: 'All',
  $pool: {},
  tags: {},
}

const SMART_MODE_FUNCTIONS = {
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
}

const normaliseTagValues = values => resolveIds(values).map(value => [value])

const SMART_MODE_COMPUTED = {
  vmsSmartPattern: ({ $pool, powerState, tags }) => ({
    $pool: constructSmartPattern($pool, resolveIds),
    power_state: powerState === 'All' ? undefined : powerState,
    tags: constructSmartPattern(tags, normaliseTagValues),
    type: 'VM',
  }),
  allVms: (state, { allVms }) => allVms,
}

const VMS_STATUSES_OPTIONS = [
  { value: 'All', label: _('vmStateAll') },
  { value: 'Running', label: _('vmStateRunning') },
  { value: 'Halted', label: _('vmStateHalted') },
]

const SmartBackup = injectState(({ state, effects }) => (
  <Card>
    <CardHeader>{_('smartBackupModeTitle')}</CardHeader>
    <CardBlock>
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
        </label>
        <SelectTag
          multi
          onChange={effects.setTagNotValues}
          value={get(state.tags, 'notValues')}
        />
      </FormGroup>
      <SmartBackupPreview vms={state.allVms} pattern={state.vmsSmartPattern} />
    </CardBlock>
  </Card>
))

// ===================================================================

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

const getRandomId = () =>
  Math.random()
    .toString(36)
    .slice(2)

export default [
  New => props => (
    <Upgrade place='newBackup' required={2}>
      <New {...props} />
    </Upgrade>
  ),
  connectStore({
    allVms: createGetObjectsOfType('VM'),
  }),
  provideState({
    initialState: () => ({
      compression: true,
      delta: false,
      formId: getRandomId(),
      name: '',
      paramsUpdated: false,
      remotes: [],
      smartMode: false,
      srs: [],
      vms: [],
      tmpSchedule: {},
      newSchedules: {},
      editionMode: undefined,
      ...SMART_MODE_INITIAL_STATE,
    }),
    effects: {
      createJob: () => async state => {
        await createBackupNgJob({
          name: state.name,
          mode: state.delta ? 'delta' : 'full',
          compression: state.compression ? 'native' : '',
          schedules: state.newSchedules,
          settings: {
            ...getNewSettings(state.newSchedules),
          },
          remotes: constructPattern(state.remotes),
          srs: constructPattern(state.srs),
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
          mode: state.delta ? 'delta' : 'full',
          compression: state.compression ? 'native' : '',
          remotes: constructPattern(state.remotes),
          srs: constructPattern(state.srs),
          vms: state.smartMode
            ? state.vmsSmartPattern
            : constructPattern(state.vms),
          settings: {
            ...newSettings,
            ...props.job.settings,
          },
        })
      },
      setDelta: (_, { target: { checked } }) => state => ({
        ...state,
        delta: checked,
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
      setRemotes: (_, remotes) => state => ({ ...state, remotes }),
      setSrs: (_, srs) => state => ({ ...state, srs }),
      setVms: (_, vms) => state => ({ ...state, vms }),
      updateParams: () => (state, { job }) => ({
        ...state,
        compression: job.compression === 'native',
        delta: job.mode === 'delta',
        name: job.name,
        paramsUpdated: true,
        smartMode: job.vms.id === undefined,
        remotes: destructPattern(job.remotes),
        srs: destructPattern(job.srs),
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
      ...SMART_MODE_FUNCTIONS,
    },
    computed: {
      needUpdateParams: (state, { job }) =>
        job !== undefined && !state.paramsUpdated,
      isJobInvalid: state =>
        state.name.trim() === '' ||
        (isEmpty(state.schedules) && isEmpty(state.newSchedules)) ||
        (isEmpty(state.vms) && !state.smartMode),
      showCompression: (state, { job }) =>
        !state.delta &&
        (some(
          state.newSchedules,
          schedule => +schedule.exportRetention !== 0
        ) ||
          (job &&
            some(job.settings, schedule => schedule.exportRetention !== 0))),
      settings: (state, { job }) => get(job, 'settings') || {},
      schedules: (state, { schedules }) => schedules || [],
      ...SMART_MODE_COMPUTED,
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
                <CardHeader>{_('job')}</CardHeader>
                <CardBlock>
                  <FormGroup>
                    <label>
                      <strong>{_('backupName')}</strong>
                    </label>
                    <Input onChange={effects.setName} value={state.name} />
                  </FormGroup>
                  <FormGroup>
                    <label>
                      <strong>{_('backupTargetRemotes')}</strong>
                    </label>
                    <SelectRemote
                      multi
                      onChange={effects.setRemotes}
                      value={state.remotes}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>
                      <strong>{_('backupTargetSrs')}</strong>
                    </label>
                    <SelectSr
                      multi
                      onChange={effects.setSrs}
                      value={state.srs}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>
                      <strong>{_('smartBackupModeTitle')}</strong>
                    </label>
                    <br />
                    <Toggle
                      onChange={effects.setSmartMode}
                      value={state.smartMode}
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
                      <SelectVm
                        multi
                        onChange={effects.setVms}
                        value={state.vms}
                      />
                    </FormGroup>
                  )}
                  {(!isEmpty(state.srs) || !isEmpty(state.remotes)) && (
                    <Upgrade place='newBackup' required={4}>
                      <FormGroup>
                        <label>
                          <input
                            type='checkbox'
                            onChange={effects.setDelta}
                            checked={state.delta}
                          />{' '}
                          <strong>{_('useDelta')}</strong>
                        </label>
                      </FormGroup>
                    </Upgrade>
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
