import _ from 'intl'
import ActionButton from 'action-button'
import defined from 'xo-defined'
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
      name: undefined,
      snapshotRetention,
      timezone,
    }),
    effects: {
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
      setSchedule: (_, { cronPattern, timezone }) => state => ({
        ...state,
        cron: cronPattern,
        timezone,
      }),
      setName: (_, { target: { value } }) => () => ({
        name: value,
      }),
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
          name,
          snapshotRetention,
          timezone,
        },
        { schedule }
      ) =>
        editionMode !== 'creation' &&
        isEqual(
          {
            copyRetention: schedule.copyRetention,
            cron: schedule.cron,
            exportRetention: schedule.exportRetention,
            name: schedule.name,
            snapshotRetention: schedule.snapshotRetention,
            timezone: schedule.timezone,
          },
          {
            copyRetention,
            cron,
            exportRetention,
            name,
            snapshotRetention,
            timezone,
          }
        ),
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
          <FormGroup>
            <label htmlFor={state.idInputName}>
              <strong>{_('formName')}</strong>
            </label>
            <Input
              id={state.idInputName}
              onChange={effects.setName}
              value={defined(state.name, state.tmpSchedule.name, '')}
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
            onChange={effects.setSchedule}
            cronPattern={state.cron}
            timezone={state.timezone}
          />
          <SchedulePreview cronPattern={state.cron} timezone={state.timezone} />
          <br />
          <ActionButton
            btnStyle='primary'
            data-copyRetention={state.copyRetention}
            data-cron={state.cron}
            data-exportRetention={state.exportRetention}
            data-name={state.name}
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
