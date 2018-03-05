import ActionButton from 'action-button'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import Upgrade from 'xoa-upgrade'
import { injectState, provideState } from '@julien-f/freactal'
import { cloneDeep, orderBy, isEmpty, map } from 'lodash'
import { SelectRemote, SelectSr, SelectVm } from 'select-objects'
import { resolveIds } from 'utils'
import {
  createBackupNgJob,
  createSchedule,
  editBackupNgJob,
  editSchedule,
} from 'xo'

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

const removeSchedulesFromSettings = tmpSchedules => {
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
      paramsUpdated: false,
      remotes: [],
      schedules: {},
      savedJob: {},
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
            ...removeSchedulesFromSettings(state.tmpSchedules),
          },
          srs: constructPattern(state.srs),
          vms: constructPattern(state.vms),
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
                exportRetention: schedule.exportRetention,
                snapshotRetention: schedule.snapshotRetention,
              }
            })
          )
        }

        await editBackupNgJob({
          id: props.job.id,
          name: state.name,
          mode: state.delta ? 'delta' : 'full',
          remotes: constructPattern(state.remotes),
          srs: constructPattern(state.srs),
          vms: constructPattern(state.vms),
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
      setDelta: (_, { target: { checked } }) => state => ({
        ...state,
        delta: checked,
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
        paramsUpdated: true,
        name: job.name,
        delta: job.mode === 'delta',
        remotes: destructPattern(job.remotes),
        srs: destructPattern(job.srs),
        vms: destructPattern(job.vms),
      }),
    },
    computed: {
      jobSettings: (state, { job: { settings } }) => settings,
      schedules: (state, { schedules }) => schedules,
      needUpdateParams: (state, { job }) =>
        job !== undefined && !state.paramsUpdated,
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
  ({ effects, state }) => {
    if (state.needUpdateParams) {
      effects.updateParams()
    }

    return (
      <form id={state.formId}>
        <FormGroup>
          <h1>BackupNG</h1>
          <label>
            <strong>Name</strong>
          </label>
          <Input onChange={effects.setName} value={state.name} />
        </FormGroup>
        <FormGroup>
          <label>
            <strong>Target remotes (for Export)</strong>
          </label>
          <SelectRemote
            multi
            onChange={effects.setRemotes}
            value={state.remotes}
          />
        </FormGroup>
        <FormGroup>
          <label>
            <strong>Target SRs (for Replication)</strong>
          </label>
          <SelectSr multi onChange={effects.setSrs} value={state.srs} />
        </FormGroup>
        <FormGroup>
          <label>
            <strong>Vms to Backup</strong>
          </label>
          <SelectVm multi onChange={effects.setVms} value={state.vms} />
        </FormGroup>
        {(!isEmpty(state.srs) || !isEmpty(state.remotes)) && (
          <Upgrade place='newBackup' required={4}>
            <FormGroup>
              <label>
                <input
                  type='checkbox'
                  onChange={effects.setDelta}
                  checked={state.delta}
                />{' '}
                Use delta
              </label>
            </FormGroup>
          </Upgrade>
        )}
        {!isEmpty(state.sortedSchedules) && (
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
        {state.paramsUpdated ? (
          <ActionButton
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
