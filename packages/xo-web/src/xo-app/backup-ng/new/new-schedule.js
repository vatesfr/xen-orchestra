import _ from 'intl'
import ActionButton from 'action-button'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import { Card, CardBlock } from 'card'
import { generateRandomId } from 'utils'
import { injectState, provideState } from '@julien-f/freactal'
import { isEqual } from 'lodash'
import { Number } from 'form'

import { DEFAULT_RETENTION, FormFeedback, FormGroup, Input } from './../utils'

const DEFAULT_SCHEDULE = {
  copyRetention: DEFAULT_RETENTION,
  exportRetention: DEFAULT_RETENTION,
  snapshotRetention: DEFAULT_RETENTION,
}

export default [
  injectState,
  provideState({
    initialState: ({
      schedule: { cron = '0 0 * * *', timezone = moment.tz.guess() },
    }) => ({
      cron,
      formId: generateRandomId(),
      idInputName: generateRandomId(),
      schedule: undefined,
      timezone,
    }),
    effects: {
      setSchedule: (_, { name, value }) => ({
        tmpSchedule = DEFAULT_SCHEDULE,
        schedule = tmpSchedule,
      }) => ({
        schedule: {
          ...schedule,
          [name]: value,
        },
      }),
      setExportRetention: ({ setSchedule }, value) => () => {
        setSchedule({
          name: 'exportRetention',
          value,
        })
      },
      setCopyRetention: ({ setSchedule }, value) => () => {
        setSchedule({
          name: 'copyRetention',
          value,
        })
      },
      setSnapshotRetention: ({ setSchedule }, value) => () => {
        setSchedule({
          name: 'snapshotRetention',
          value,
        })
      },
      setCronTimezone: (_, { cronPattern, timezone }) => state => ({
        ...state,
        cron: cronPattern,
        timezone,
      }),
      setName: ({ setSchedule }, { target: { value } }) => () => {
        setSchedule({
          name: 'name',
          value: value.trim() === '' ? null : value,
        })
      },
    },
    computed: {
      isScheduleInvalid: ({ retentionNeeded, scheduleNotEdited }) =>
        retentionNeeded || scheduleNotEdited,
      retentionNeeded: ({ copyMode, exportMode, schedule, snapshotMode }) =>
        schedule !== undefined &&
        !(
          (exportMode && schedule.exportRetention > 0) ||
          (copyMode && schedule.copyRetention > 0) ||
          (snapshotMode && schedule.snapshotRetention > 0)
        ),
      scheduleNotEdited: (
        { cron, editionMode, schedule, timezone },
        { schedule: propSchedule }
      ) =>
        editionMode !== 'creation' &&
        schedule === undefined &&
        isEqual(
          {
            cron: propSchedule.cron,
            timezone: propSchedule.timezone,
          },
          {
            cron,
            timezone,
          }
        ),
    },
  }),
  injectState,
  ({ effects, state }) => {
    const { tmpSchedule = DEFAULT_SCHEDULE, schedule = tmpSchedule } = state
    const { name, copyRetention, snapshotRetention, exportRetention } = schedule

    return (
      <form id={state.formId}>
        <FormFeedback
          component={Card}
          error={state.retentionNeeded}
          message={_('retentionNeeded')}
        >
          <CardBlock>
            <FormGroup>
              <label htmlFor={state.idInputName}>
                <strong>{_('formName')}</strong>
              </label>
              <Input
                id={state.idInputName}
                onChange={effects.setName}
                value={name}
              />
            </FormGroup>
            {state.exportMode && (
              <FormGroup>
                <label>
                  <strong>{_('scheduleExportRetention')}</strong>
                </label>
                <Number
                  min='0'
                  onChange={effects.setExportRetention}
                  value={exportRetention}
                />
              </FormGroup>
            )}
            {state.copyMode && (
              <FormGroup>
                <label>
                  <strong>{_('scheduleCopyRetention')}</strong>
                </label>
                <Number
                  min='0'
                  onChange={effects.setCopyRetention}
                  value={copyRetention}
                />
              </FormGroup>
            )}
            {state.snapshotMode && (
              <FormGroup>
                <label>
                  <strong>{_('snapshotRetention')}</strong>
                </label>
                <Number
                  min='0'
                  onChange={effects.setSnapshotRetention}
                  value={snapshotRetention}
                />
              </FormGroup>
            )}
            <Scheduler
              onChange={effects.setCronTimezone}
              cronPattern={state.cron}
              timezone={state.timezone}
            />
            <SchedulePreview
              cronPattern={state.cron}
              timezone={state.timezone}
            />
            <br />
            <ActionButton
              btnStyle='primary'
              data-copyRetention={copyRetention}
              data-cron={state.cron}
              data-exportRetention={exportRetention}
              data-name={name}
              data-snapshotRetention={snapshotRetention}
              data-timezone={state.timezone}
              disabled={state.isScheduleInvalid}
              form={state.formId}
              handler={effects.saveSchedule}
              icon='save'
              size='large'
            >
              {_('formSave')}
            </ActionButton>
            <ActionButton
              className='pull-right'
              handler={effects.cancelSchedule}
              icon='cancel'
              size='large'
            >
              {_('formCancel')}
            </ActionButton>
          </CardBlock>
        </FormFeedback>
      </form>
    )
  },
].reduceRight((value, decorator) => decorator(value))
