import ActionButton from 'action-button'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import Upgrade from 'xoa-upgrade'
import { injectState, provideState } from '@julien-f/freactal'
import { cloneDeep, orderBy, isEmpty, map } from 'lodash'
import { SelectRemote, SelectSr, SelectVm } from 'select-objects'
import { resolveIds } from 'utils'
import { createBackupNgJob, editBackupNgJob, editSchedule } from 'xo'

const FormGroup = props => <div {...props} className='form-group' />
const Input = props => <input {...props} className='form-control' />

const DEFAULT_CRON_PATTERN = '0 0 * * *'
const DEFAULT_TIMEZONE = moment.tz.guess()

const constructPattern = values => ({
  id: {
    __or: resolveIds(values),
  },
})

const destructPattern = pattern => pattern.id.__or

const removeScheduleFromSettings = tmpSchedules => {
  const newTmpSchedules = cloneDeep(tmpSchedules)

  for (const schedule in newTmpSchedules) {
    delete newTmpSchedules[schedule].cron
    delete newTmpSchedules[schedule].timezone
  }

  return newTmpSchedules
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
  provideState({
    initialState: () => ({
      delta: false,
      formId: getRandomId(),
      tmpSchedule: {
        cron: DEFAULT_CRON_PATTERN,
        timezone: DEFAULT_TIMEZONE,
      },
      exportRetention: 0,
      snapshotRetention: 0,
      name: '',
      remotes: [],
      schedules: {},
      savedJob: {},
      editedName: false,
      editedRemotes: false,
      editedSrs: false,
      editedVms: false,
      editedDelta: false,
      srs: [],
      vms: [],
      tmpSchedules: {},
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
          remotes: constructPattern(state.remotes),
          schedules: state.tmpSchedules,
          settings: {
            ...removeScheduleFromSettings(state.tmpSchedules),
          },
          srs: constructPattern(state.srs),
          vms: constructPattern(state.vms),
        })
      },
      editJob: () => async (state, props) => {
        await editBackupNgJob({
          id: props.job.id,
          name: state.name || props.name,
          mode: state.delta || props.delta ? 'delta' : 'full',
          remotes: state.remotes
            ? constructPattern(state.remotes)
            : props.remotes,
          settings: {
            ...removeScheduleFromSettings(state.tmpSchedules),
            ...props.job.settings,
          },
          srs: state.srs ? constructPattern(state.srs) : props.srs,
          vms: state.vms ? constructPattern(state.vms) : props.vms,
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
      populateSchedule: (_, { cron, timezone, ...props }) => state => ({
        ...state,
        ...props,
        tmpSchedule: {
          cron,
          timezone,
        },
      }),
      editSchedule: (_, { scheduleId }) => async (state, props) => {
        await editSchedule({
          id: scheduleId,
          jobId: props.job.id,
          ...state.tmpSchedule,
        })
        await editBackupNgJob({
          id: props.job.id,
          settings: {
            ...props.job.settings,
            [scheduleId]: {
              exportRetention: state.exportRetention,
              snapshotRetention: state.snapshotRetention,
            },
          },
        })
      },
      editTmpSchedule: (_, { scheduleId }) => state => ({
        ...state,
        tmpSchedules: {
          ...state.tmpSchedules,
          [scheduleId]: {
            ...state.tmpSchedule,
            exportRetention: state.exportRetention,
            snapshotRetention: state.snapshotRetention,
          },
        },
      }),
      setDelta: (_, { target: { value } }) => state => ({
        ...state,
        editedDelta: true,
        delta: value,
      }),
      setName: (_, { target: { value } }) => state => ({
        ...state,
        editedName: true,
        name: value,
      }),
      setRemotes: (_, remotes) => state => ({
        ...state,
        editedRemotes: true,
        remotes,
      }),
      setSrs: (_, srs) => state => ({ ...state, editedSrs: true, srs }),
      setVms: (_, vms) => state => ({ ...state, editedVms: true, vms }),
    },
    computed: {
      schedules: (state, { schedules }) => schedules,
      jobSettings: (state, { job: { settings } }) => settings,
      getName: (state, { job }) =>
        state.editedName || job === undefined ? state.name : job.name,
      getRemotes: (state, { job }) =>
        state.editedRemotes || job === undefined
          ? state.remotes
          : destructPattern(job.remotes),
      getSrs: (state, { job }) =>
        state.editedSrs || job === undefined
          ? state.srs
          : destructPattern(job.srs),
      getVms: (state, { job }) =>
        state.editedVms || job === undefined
          ? state.vms
          : destructPattern(job.vms),
      getDelta: (state, { job }) =>
        state.editedDelta || job === undefined ? state.delta : job.delta,
      isInvalid: state =>
        state.name.trim() === '' ||
        (isEmpty(state.schedules) &&
          isEmpty(state.tmpSchedules) &&
          isEmpty(state.vms)),
      sortedSchedules: ({ schedules }) => orderBy(schedules, 'name'),
      // TO DO: use sortedTmpSchedules
      sortedTmpSchedules: ({ tmpSchedules }) => orderBy(tmpSchedules, 'id'),
    },
  }),
  injectState,
  ({ effects, state }) => (
    <form id={state.formId}>
      <FormGroup>
        <h1>BackupNG</h1>
        <label>
          <strong>Name</strong>
        </label>
        <Input onChange={effects.setName} value={state.getName} />
      </FormGroup>
      <FormGroup>
        <label>
          <strong>Target remotes (for Export)</strong>
        </label>
        <SelectRemote
          multi
          onChange={effects.setRemotes}
          value={state.getRemotes}
        />
      </FormGroup>
      <FormGroup>
        <label>
          <strong>Target SRs (for Replication)</strong>
        </label>
        <SelectSr multi onChange={effects.setSrs} value={state.getSrs} />
      </FormGroup>
      <FormGroup>
        <label>
          <strong>Vms to Backup</strong>
        </label>
        <SelectVm multi onChange={effects.setVms} value={state.getVms} />
      </FormGroup>
      {(!isEmpty(state.getSrs) || !isEmpty(state.getRemotes)) && (
        <Upgrade place='newBackup' required={4}>
          <FormGroup>
            <label>
              <input
                type='checkbox'
                onChange={effects.setDelta}
                value={state.getDelta}
              />{' '}
              Use delta
            </label>
          </FormGroup>
        </Upgrade>
      )}
      {!isEmpty(state.schedules) && (
        <FormGroup>
          <h3>Saved schedules</h3>
          <ul>
            {state.sortedSchedules.map(schedule => (
              <li key={schedule.id}>
                {schedule.name} {schedule.cron} {schedule.timezone}{' '}
                {state.jobSettings[schedule.id].exportRetention}{' '}
                {state.jobSettings[schedule.id].snapshotRetention}
                <ActionButton
                  handler={effects.populateSchedule}
                  data-cron={schedule.cron}
                  data-timezone={schedule.timezone}
                  data-exportRetention={
                    state.jobSettings[schedule.id].exportRetention
                  }
                  data-snapshotRetention={
                    state.jobSettings[schedule.id].snapshotRetention
                  }
                  icon='edit'
                  size='small'
                />
                <ActionButton
                  data-scheduleId={schedule.id}
                  handler={effects.editSchedule}
                  icon='save'
                  size='small'
                />
              </li>
            ))}
          </ul>
        </FormGroup>
      )}
      {!isEmpty(state.tmpSchedules) && (
        <FormGroup>
          <h3>New schedules</h3>
          <ul>
            {map(state.tmpSchedules, (schedule, key) => (
              <li key={key}>
                {schedule.cron} {schedule.timezone} {schedule.exportRetention}{' '}
                {schedule.snapshotRetention}
                <ActionButton
                  data-scheduleId={key}
                  handler={effects.editTmpSchedule}
                  icon='edit'
                  size='small'
                />
              </li>
            ))}
          </ul>
        </FormGroup>
      )}
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
        <ActionButton handler={effects.addSchedule} icon='add'>
          Add a schedule
        </ActionButton>
      </FormGroup>
      <ActionButton
        disabled={state.isInvalid}
        form={state.formId}
        handler={effects.createJob}
        redirectOnSuccess='/backup-ng'
        icon='save'
      >
        Create
      </ActionButton>
      <ActionButton
        handler={effects.editJob}
        icon='save'
        redirectOnSuccess='/backup-ng'
      >
        Edit
      </ActionButton>
    </form>
  ),
].reduceRight((value, decorator) => decorator(value))
