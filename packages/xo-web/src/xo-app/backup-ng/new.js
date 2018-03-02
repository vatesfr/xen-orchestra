import _, { messages } from 'intl'
import ActionButton from 'action-button'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import Upgrade from 'xoa-upgrade'
import { injectState, provideState } from '@julien-f/freactal'
import { cloneDeep, orderBy, size, isEmpty, map } from 'lodash'
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

const removeScheduleFromSettings = tmpSchedules => {
  const newTmpSchedules = cloneDeep(tmpSchedules)

  for (let schedule in newTmpSchedules) {
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
            ...state.schedules,
          },
          srs: constructPattern(state.srs),
          vms: constructPattern(state.vms),
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
      editSchedule: (
        _,
        { target: { dataset: { scheduleId } } }
      ) => state => ({}),
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
        delta: value,
      }),
      setName: (_, { target: { value } }) => state => ({
        ...state,
        name: value,
      }),
      setRemotes: (_, remotes) => state => ({ ...state, remotes }),
      setSrs: (_, srs) => state => ({ ...state, srs }),
      setVms: (_, vms) => state => ({ ...state, vms }),
    },
    computed: {
      isInvalid: state =>
        state.name.trim() === '' ||
        (isEmpty(state.schedules) && isEmpty(state.tmpSchedules)),
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
        <Input onChange={effects.setName} value={state.name} />
      </FormGroup>
      <FormGroup>
        <label>Target remotes (for Export)</label>
        <SelectRemote
          multi
          onChange={effects.setRemotes}
          value={state.remotes}
        />
      </FormGroup>
      <FormGroup>
        <label>
          Target SRs (for Replication)
          <SelectSr multi onChange={effects.setSrs} value={state.srs} />
        </label>
      </FormGroup>
      <FormGroup>
        <label>
          Vms to Backup
          <SelectVm multi onChange={effects.setVms} value={state.vms} />
        </label>
      </FormGroup>
      {false /* TODO: remove when implemented */ && (!isEmpty(state.srs) || !isEmpty(state.remotes)) && (
        <Upgrade place='newBackup' required={4}>
          <FormGroup>
            <label>
              <input
                type='checkbox'
                onChange={effects.setDelta}
                value={state.delta}
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
                {schedule.name} {schedule.cron} {schedule.timezone}
                <ActionButton
                  data-scheduleId={schedule.id}
                  handler={effects.editSchedule}
                  icon='edit'
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
        <h1>BackupNG</h1>
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
    </form>
  ),
].reduceRight((value, decorator) => decorator(value))
