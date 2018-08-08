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

import { FormFeedback, FormGroup, Input } from './../utils'

export default [
  injectState,
  provideState({
    initialState: ({
      copyMode,
      exportMode,
      snapshotMode,
      schedule: {
        cron = '0 0 * * *',
        exportRetention = exportMode ? 1 : undefined,
        copyRetention = copyMode ? 1 : undefined,
        snapshotRetention = snapshotMode ? 1 : undefined,
        timezone = moment.tz.guess(),
      },
    }) => ({
      copyRetention,
      cron,
      exportRetention,
      formId: generateRandomId(),
      idInputName: generateRandomId(),
      schedule: undefined,
      snapshotRetention,
      timezone,
    }),
    effects: {
      setSchedule: (_, { name, value }) => ({
        tmpSchedule,
        schedule = tmpSchedule,
      }) => ({
        schedule: {
          ...schedule,
          [name]: value,
        },
      }),
      setExportRetention: (_, value) => state => ({
        ...state,
        exportRetention: value,
      }),
      setCopyRetention: (_, value) => state => ({
        ...state,
        copyRetention: value,
      }),
      setSnapshotRetention: (_, value) => state => ({
        ...state,
        snapshotRetention: value,
      }),
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
      retentionNeeded: ({
        exportMode,
        exportRetention,
        copyMode,
        copyRetention,
        snapshotMode,
        snapshotRetention,
      }) =>
        !(
          (exportMode && exportRetention > 0) ||
          (copyMode && copyRetention > 0) ||
          (snapshotMode && snapshotRetention > 0)
        ),
      scheduleNotEdited: (
        {
          copyRetention,
          cron,
          editionMode,
          exportRetention,
          schedule,
          snapshotRetention,
          timezone,
        },
        { schedule: propSchedule }
      ) =>
        editionMode !== 'creation' &&
        schedule === undefined &&
        isEqual(
          {
            copyRetention: propSchedule.copyRetention,
            cron: propSchedule.cron,
            exportRetention: propSchedule.exportRetention,
            snapshotRetention: propSchedule.snapshotRetention,
            timezone: propSchedule.timezone,
          },
          {
            copyRetention,
            cron,
            exportRetention,
            snapshotRetention,
            timezone,
          }
        ),
    },
  }),
  injectState,
  ({ effects, state }) => {
    const { tmpSchedule = {}, schedule = tmpSchedule } = state
    const { name } = schedule

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
                  <strong>{_('exportRetention')}</strong>
                </label>
                <Number
                  min='0'
                  onChange={effects.setExportRetention}
                  value={state.exportRetention}
                />
              </FormGroup>
            )}
            {state.copyMode && (
              <FormGroup>
                <label>
                  <strong>{_('copyRetention')}</strong>
                </label>
                <Number
                  min='0'
                  onChange={effects.setCopyRetention}
                  value={state.copyRetention}
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
                  value={state.snapshotRetention}
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
              data-copyRetention={state.copyRetention}
              data-cron={state.cron}
              data-exportRetention={state.exportRetention}
              data-name={name}
              data-snapshotRetention={state.snapshotRetention}
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
