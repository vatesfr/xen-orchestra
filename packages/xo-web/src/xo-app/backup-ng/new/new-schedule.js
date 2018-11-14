import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import { Card, CardBlock } from 'card'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { Number } from 'form'

import { FormGroup, Input } from './../utils'

export default decorate([
  provideState({
    computed: {
      formId: generateId,
      idInputName: generateId,
    },
    effects: {
      setSchedule: (_, params) => (_, { value, onChange }) => {
        onChange({
          ...value,
          ...params,
        })
      },
      setExportRetention: ({ setSchedule }, exportRetention) => () => {
        setSchedule({
          exportRetention,
        })
      },
      setCopyRetention: ({ setSchedule }, copyRetention) => () => {
        setSchedule({
          copyRetention,
        })
      },
      setSnapshotRetention: ({ setSchedule }, snapshotRetention) => () => {
        setSchedule({
          snapshotRetention,
        })
      },
      setCronTimezone: (
        { setSchedule },
        { cronPattern: cron, timezone }
      ) => () => {
        setSchedule({
          cron,
          timezone,
        })
      },
      setName: ({ setSchedule }, { target: { value } }) => () => {
        setSchedule({
          name: value.trim() === '' ? null : value,
        })
      },
    },
  }),
  injectState,
  ({ effects, state, modes, value: schedule }) => (
    <Card>
      <CardBlock>
        <FormGroup>
          <label htmlFor={state.idInputName}>
            <strong>{_('formName')}</strong>
          </label>
          <Input
            id={state.idInputName}
            onChange={effects.setName}
            value={schedule.name}
          />
        </FormGroup>
        {modes.exportMode && (
          <FormGroup>
            <label>
              <strong>{_('scheduleExportRetention')}</strong>
            </label>
            <Number
              min='0'
              onChange={effects.setExportRetention}
              value={schedule.exportRetention}
              required
            />
          </FormGroup>
        )}
        {modes.copyMode && (
          <FormGroup>
            <label>
              <strong>{_('scheduleCopyRetention')}</strong>
            </label>
            <Number
              min='0'
              onChange={effects.setCopyRetention}
              value={schedule.copyRetention}
              required
            />
          </FormGroup>
        )}
        {modes.snapshotMode && (
          <FormGroup>
            <label>
              <strong>{_('snapshotRetention')}</strong>
            </label>
            <Number
              min='0'
              onChange={effects.setSnapshotRetention}
              value={schedule.snapshotRetention}
              required
            />
          </FormGroup>
        )}
        <Scheduler
          onChange={effects.setCronTimezone}
          cronPattern={schedule.cron}
          timezone={schedule.timezone}
        />
        <SchedulePreview
          cronPattern={schedule.cron}
          timezone={schedule.timezone}
        />
      </CardBlock>
    </Card>
  ),
])
