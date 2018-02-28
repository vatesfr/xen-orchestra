import React from 'react'
import ActionButton from 'action-button'
import Upgrade from 'xoa-upgrade'
import { orderBy } from 'lodash'
import { injectState, provideState } from '@julien-f/freactal'
import { SelectRemote, SelectSr } from 'select-objects'
import {
  createBackupNgJob,
  createSchedule,
  editBackupNgJob,
  editSchedule,
} from 'xo'

const FormGroup = props => <div {...props} className='form-group' />
const Input = props => <input {...props} className='form-control' />

export default [
  New => props => (
    <Upgrade place='newBackup' required={2}>
      <New {...props} />
    </Upgrade>
  ),
  provideState({
    initialState: () => ({
      delta: true,
      formId: Math.random()
        .toString(36)
        .slice(2),
      name: '',
      remotes: [],
      schedules: {},
      srs: [],
    }),
    effects: {
      createJob: () => (state, props) => {
        console.log({ ...state })
      },
      editSchedule: (
        _,
        { target: { dataset: { scheduleId } } }
      ) => state => ({}),
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
    },
    computed: {
      isInvalid: state =>
        state.name.trim() === '' || state.schedules.length === 0,
      sortedSchedules: ({ schedules }) => orderBy(schedules, 'name'),
    },
  }),
  injectState,
  ({ effects, state }) => (
    <form id={state.formId}>
      <FormGroup>
        <label>
          Name
          <Input onChange={effects.setName} value={state.name} />
        </label>
      </FormGroup>
      <FormGroup>
        <label>
          Target remotes (for Export)
          <SelectRemote
            multi
            onChange={effects.setRemotes}
            value={state.remotes}
          />
        </label>
      </FormGroup>
      <FormGroup>
        <label>
          Target SRs (for Replication)
          <SelectSr multi onChange={effects.setSrs} value={state.srs} />
        </label>
      </FormGroup>
      {(state.srs.length !== 0 || state.remotes.length !== 0) && (
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
      <FormGroup>
        <ul>
          {state.sortedSchedules.map(schedule => (
            <li key={schedule.id}>
              {schedule.name} {schedule.pattern} {schedule.timezone}
              <ActionButton
                data-scheduleId={schedule.id}
                handler={effects.editSchedule}
                icon='edit'
                size='small'
              />
            </li>
          ))}
        </ul>
        <ActionButton handler={effects.addSchedule} icon='add'>
          Add a schedule
        </ActionButton>
      </FormGroup>
      <ActionButton
        disabled={!state.isValid}
        form={state.formId}
        handler={effects.createJob}
        icon='save'
      >
        Create
      </ActionButton>
    </form>
  ),
].reduceRight((value, decorator) => decorator(value))
