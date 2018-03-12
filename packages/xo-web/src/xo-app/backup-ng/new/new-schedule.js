import _ from 'intl'
import ActionButton from 'action-button'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import { Card, CardBlock } from 'card'
import { injectState, provideState } from '@julien-f/freactal'

import { FormGroup, Input } from './form'

export default [
  injectState,
  provideState({
    initialState: ({
      schedule: {
        cron = '0 0 * * *',
        exportRetention = 0,
        snapshotRetention = 0,
        timezone = moment.tz.guess(),
      },
    }) => ({
      cron,
      exportRetention,
      snapshotRetention,
      timezone,
    }),
    effects: {
      setExportRetention: (_, { target: { value } }) => state => ({
        ...state,
        exportRetention: value,
      }),
      setSnapshotRetention: (_, { target: { value } }) => state => ({
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
      isScheduleInvalid: ({ snapshotRetention, exportRetention }) =>
        (+snapshotRetention === 0 || snapshotRetention === '') &&
        (+exportRetention === 0 || exportRetention === ''),
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardBlock>
        {state.exportMode && (
          <FormGroup>
            <label>
              <strong>{_('exportRetention')}</strong>
            </label>
            <Input
              type='number'
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
            <Input
              type='number'
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
          handler={effects.saveSchedule}
          icon='save'
          size='large'
        >
          {_('scheduleSave')}
        </ActionButton>
        <ActionButton
          className='pull-right'
          handler={effects.cancelSchedule}
          icon='save'
          size='large'
        >
          {_('cancelScheduleEdition')}
        </ActionButton>
      </CardBlock>
    </Card>
  ),
].reduceRight((value, decorator) => decorator(value))
