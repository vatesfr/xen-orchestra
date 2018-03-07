import _ from 'intl'
import ActionButton from 'action-button'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import SmartBackupPreview from 'smart-backup-preview'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore, resolveIds } from 'utils'
import {
  constructSmartPattern,
  destructSmartPattern,
} from 'smart-backup-pattern'
import { createGetObjectsOfType } from 'selectors'
import { injectState, provideState } from '@julien-f/freactal'
import { Select, Toggle } from 'form'
import { findKey, flatten, get, isEmpty, map, size, some } from 'lodash'
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

const SCHEDULES_INITIAL_STATE = {
  schedules: {},
  tmpSchedules: {},
}

const SCHEDULES_COMPUTED = {
  jobSettings: (state, { job }) => job && job.settings,
  schedules: (state, { schedules }) => schedules,
  isScheduleInvalid: state =>
    (+state.snapshotRetention === 0 || state.snapshotRetention === '') &&
    (+state.exportRetention === 0 || state.exportRetention === ''),
  canDeleteSchedule: state =>
    state.schedules.length + size(state.tmpSchedules) > 1,
}

const SCHEDULES_FUNCTIONS = {
  populateSchedule: (_, { cron, timezone, ...props }) => state => ({
    ...state,
    ...props,
    tmpSchedule: {
      cron,
      timezone,
    },
  }),
  editSchedule: (_, id) => async (state, props) => {
    await editSchedule({
      id,
      jobId: props.job.id,
      ...state.tmpSchedule,
    })
    await editBackupNgJob({
      id: props.job.id,
      settings: {
        ...props.job.settings,
        [id]: {
          exportRetention: +state.exportRetention,
          snapshotRetention: +state.snapshotRetention,
        },
      },
    })
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
  editTmpSchedule: (_, id) => state => ({
    ...state,
    tmpSchedules: {
      ...state.tmpSchedules,
      [id]: {
        ...state.tmpSchedule,
        exportRetention: state.exportRetention,
        snapshotRetention: state.snapshotRetention,
      },
    },
  }),
  deleteTmpSchedule: (_, id) => state => {
    const tmpSchedules = { ...state.tmpSchedules }
    delete tmpSchedules[id]
    return {
      ...state,
      tmpSchedules,
    }
  },
}

const SAVED_SCHEDULES_INDIVIDUAL_ACTIONS = [
  {
    handler: (schedule, { effects: { populateSchedule } }) =>
      populateSchedule(schedule),
    label: '',
    icon: 'edit',
    level: 'warning',
  },
  {
    handler: (schedule, { effects: { editSchedule } }) =>
      editSchedule(schedule.id),
    label: '',
    disabled: (_, { disabledEdition }) => disabledEdition,
    icon: 'save',
    level: 'primary',
  },
  {
    handler: (schedule, { effects: { deleteSchedule } }) =>
      deleteSchedule(schedule.id),
    label: '',
    disabled: (_, { disabledSupression }) => disabledSupression,
    icon: 'delete',
    level: 'danger',
  },
]

const NEW_SCHEDULES_INDIVIDUAL_ACTIONS = [
  {
    handler: (schedule, { effects: { editTmpSchedule }, tmpSchedules }) =>
      editTmpSchedule(findKey(tmpSchedules, schedule)),
    label: '',
    disabled: (_, { disabledEdition }) => disabledEdition,
    icon: 'save',
    level: 'primary',
  },
  {
    handler: (schedule, { effects: { deleteTmpSchedule }, tmpSchedules }) =>
      deleteTmpSchedule(findKey(tmpSchedules, schedule)),
    label: '',
    disabled: (_, { disabledSupression }) => disabledSupression,
    icon: 'delete',
    level: 'danger',
  },
]

const SCHEDULES_COLUMNS = [
  {
    itemRenderer: _ => _.cron,
    sortCriteria: 'cron',
    name: _('scheduleCron'),
  },
  {
    itemRenderer: _ => _.timezone,
    sortCriteria: 'timezone',
    name: _('scheduleTimezone'),
  },
  {
    itemRenderer: _ => _.exportRetention,
    sortCriteria: _ => _.exportRetention,
    name: _('scheduleExportRetention'),
  },
  {
    itemRenderer: _ => _.snapshotRetention,
    sortCriteria: _ => _.snapshotRetention,
    name: _('scheduleSnapshotRetention'),
  },
]

const SAVED_SCHEDULES_COLUMNS = [
  {
    itemRenderer: _ => _.name,
    sortCriteria: 'name',
    name: _('scheduleName'),
    default: true,
  },
  ...SCHEDULES_COLUMNS,
]

const rowTransform = (schedule, { jobSettings }) => {
  const jobShedule = jobSettings[schedule.id]

  return {
    ...schedule,
    exportRetention: jobShedule && jobShedule.exportRetention,
    snapshotRetention: jobShedule && jobShedule.snapshotRetention,
  }
}

const SchedulesOverview = injectState(({ state, effects }) => (
  <Card>
    <CardHeader>{_('backupSchedules')}</CardHeader>
    <CardBlock>
      {isEmpty(state.schedules) &&
        isEmpty(state.tmpSchedules) && (
          <p className='text-xs-center'>{_('noSchedules')}</p>
        )}
      {!isEmpty(state.schedules) && (
        <FormGroup>
          <label>
            <strong>{_('backupSavedSchedules')}</strong>
          </label>
          <SortedTable
            collection={state.schedules}
            columns={SAVED_SCHEDULES_COLUMNS}
            data-disabledEdition={state.isScheduleInvalid}
            data-disabledSupression={!state.canDeleteSchedule}
            data-effects={effects}
            data-jobSettings={state.jobSettings}
            individualActions={SAVED_SCHEDULES_INDIVIDUAL_ACTIONS}
            rowTransform={rowTransform}
          />
        </FormGroup>
      )}
      {!isEmpty(state.tmpSchedules) && (
        <FormGroup>
          <label>
            <strong>{_('backupNewSchedules')}</strong>
          </label>
          <SortedTable
            collection={state.tmpSchedules}
            columns={SCHEDULES_COLUMNS}
            data-disabledEdition={state.isScheduleInvalid}
            data-disabledSupression={!state.canDeleteSchedule}
            data-effects={effects}
            data-tmpSchedules={state.tmpSchedules}
            individualActions={NEW_SCHEDULES_INDIVIDUAL_ACTIONS}
          />
        </FormGroup>
      )}
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

const FormGroup = props => <div {...props} className='form-group' />
const Input = props => <input {...props} className='form-control' />

const DEFAULT_CRON_PATTERN = '0 0 * * *'
const DEFAULT_TIMEZONE = moment.tz.guess()

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
      exportRetention: 0,
      formId: getRandomId(),
      name: '',
      paramsUpdated: false,
      remotes: [],
      snapshotRetention: 0,
      smartMode: false,
      srs: [],
      tmpSchedule: {
        cron: DEFAULT_CRON_PATTERN,
        timezone: DEFAULT_TIMEZONE,
      },
      vms: [],
      ...SMART_MODE_INITIAL_STATE,
      ...SCHEDULES_INITIAL_STATE,
    }),
    effects: {
      addSchedule: () => state => {
        const id = getRandomId()

        return {
          ...state,
          tmpSchedules: {
            ...state.tmpSchedules,
            [id]: {
              ...state.tmpSchedule,
              exportRetention: state.exportRetention,
              snapshotRetention: state.snapshotRetention,
            },
          },
        }
      },
      createJob: () => async state => {
        await createBackupNgJob({
          name: state.name,
          mode: state.delta ? 'delta' : 'full',
          compression: state.compression ? 'native' : '',
          schedules: state.tmpSchedules,
          settings: {
            ...getNewSettings(state.tmpSchedules),
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
        if (!isEmpty(state.tmpSchedules)) {
          await Promise.all(
            map(state.tmpSchedules, async schedule => {
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
      setTmpSchedule: (_, schedule) => state => ({
        ...state,
        tmpSchedule: {
          cron: schedule.cronPattern,
          timezone: schedule.timezone,
        },
      }),
      setExportRetention: (_, { target: { value } }) => state => ({
        ...state,
        exportRetention: value,
      }),
      setSnapshotRetention: (_, { target: { value } }) => state => ({
        ...state,
        snapshotRetention: value,
      }),
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
      ...SMART_MODE_FUNCTIONS,
      ...SCHEDULES_FUNCTIONS,
    },
    computed: {
      needUpdateParams: (state, { job }) =>
        job !== undefined && !state.paramsUpdated,
      isInvalid: state =>
        state.name.trim() === '' ||
        (isEmpty(state.schedules) && isEmpty(state.tmpSchedules)) ||
        (isEmpty(state.vms) && !state.smartMode),
      showCompression: (state, { job }) =>
        !state.delta &&
        (some(
          state.tmpSchedules,
          schedule => +schedule.exportRetention !== 0
        ) ||
          (job &&
            some(job.settings, schedule => schedule.exportRetention !== 0))),
      ...SMART_MODE_COMPUTED,
      ...SCHEDULES_COMPUTED,
    },
  }),
  injectState,
  ({ effects, state }) => {
    if (state.needUpdateParams) {
      effects.updateParams()
    }

    return (
      <form id={state.formId}>
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
          <SelectSr multi onChange={effects.setSrs} value={state.srs} />
        </FormGroup>
        <FormGroup>
          <label>
            <strong>{_('smartBackupModeTitle')}</strong>
          </label>
          <br />
          <Toggle onChange={effects.setSmartMode} value={state.smartMode} />
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
            <SelectVm multi onChange={effects.setVms} value={state.vms} />
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
        <SchedulesOverview />
        <FormGroup>
          <h1>Schedule</h1>
          <label>
            <strong>Export retention</strong>
          </label>
          <Input
            type='number'
            onChange={effects.setExportRetention}
            value={state.exportRetention}
          />
          <label>
            <strong>Snapshot retention</strong>
          </label>
          <Input
            type='number'
            onChange={effects.setSnapshotRetention}
            value={state.snapshotRetention}
          />
          <Scheduler
            cronPattern={state.tmpSchedule.cron}
            onChange={effects.setTmpSchedule}
            timezone={state.tmpSchedule.timezone}
          />
          <SchedulePreview
            cronPattern={state.tmpSchedule.cron}
            timezone={state.tmpSchedule.timezone}
          />
          <br />
          <ActionButton
            disabled={state.isScheduleInvalid}
            handler={effects.addSchedule}
            icon='add'
          >
            Add a schedule
          </ActionButton>
        </FormGroup>
        {state.paramsUpdated ? (
          <ActionButton
            disabled={state.isInvalid}
            handler={effects.editJob}
            form={state.formId}
            icon='save'
            redirectOnSuccess='/backup-ng'
          >
            Edit
          </ActionButton>
        ) : (
          <ActionButton
            disabled={state.isInvalid}
            form={state.formId}
            handler={effects.createJob}
            redirectOnSuccess='/backup-ng'
            icon='save'
          >
            Create
          </ActionButton>
        )}
      </form>
    )
  },
].reduceRight((value, decorator) => decorator(value))
