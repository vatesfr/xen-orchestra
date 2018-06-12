import _ from 'intl'
import ActionButton from 'action-button'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import { Card, CardBlock } from 'card'
import { injectState, provideState } from '@julien-f/freactal'
import { isEqual } from 'lodash'

import { FormFeedback, FormGroup, getRandomId, Number } from './utils'

export default [
  injectState,
  provideState({
    initialState: ({
      schedule: {
        cron = '0 0 * * *',
        exportRetention = 1,
        snapshotRetention = 1,
        timezone = moment.tz.guess(),
      },
    }) => ({
      oldSchedule: {
        cron,
        exportRetention,
        snapshotRetention,
        timezone,
      },
      cron,
      exportRetention,
      formId: getRandomId(),
      snapshotRetention,
      timezone,
    }),
    effects: {
      setExportRetention: (_, value) => state => ({
        ...state,
        exportRetention: value,
      }),
      setSnapshotRetention: (_, value) => state => ({
        ...state,
        snapshotRetention: value,
      }),
      setSchedule: (_, { cronPattern, timezone }) => state => ({
        ...state,
        cron: cronPattern,
        timezone,
      }),
    },
    computed: {
      isScheduleInvalid: ({ retentionNeeded, scheduleNotEdited }) =>
        retentionNeeded || scheduleNotEdited,
      retentionNeeded: ({
        exportMode,
        exportRetention,
        snapshotMode,
        snapshotRetention,
      }) =>
        !(
          (exportMode && exportRetention !== 0) ||
          (snapshotMode && snapshotRetention !== 0)
        ),
      scheduleNotEdited: ({
        cron,
        editionMode,
        exportRetention,
        oldSchedule,
        snapshotRetention,
        timezone,
      }) =>
        editionMode !== 'creation' &&
        isEqual(oldSchedule, {
          cron,
          exportRetention,
          snapshotRetention,
          timezone,
        }),
    },
  }),
  injectState,
  ({ effects, state }) => (
    <form id={state.formId}>
      <FormFeedback
        component={Card}
        error={state.retentionNeeded}
        message={_('retentionNeeded')}
      >
        <CardBlock>
          {state.exportMode && (
            <FormGroup>
              <label>
                <strong>{_('exportRetention')}</strong>
              </label>
              <Number
                onChange={effects.setExportRetention}
                value={state.exportRetention}
              />
            </FormGroup>
          )}
          {state.snapshotMode && (
            <FormGroup>
              <label>
                <strong>{_('snapshotRetention')}</strong>
              </label>
              <Number
                onChange={effects.setSnapshotRetention}
                value={state.snapshotRetention}
              />
            </FormGroup>
          )}
          <Scheduler
            onChange={effects.setSchedule}
            cronPattern={state.cron}
            timezone={state.timezone}
          />
          <SchedulePreview cronPattern={state.cron} timezone={state.timezone} />
          <br />
          <ActionButton
            btnStyle='primary'
            data-cron={state.cron}
            data-exportRetention={state.exportRetention}
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
  ),
].reduceRight((value, decorator) => decorator(value))
