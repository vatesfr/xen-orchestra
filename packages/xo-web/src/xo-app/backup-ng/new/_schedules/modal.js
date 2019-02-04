import _ from 'intl'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import { Card, CardBlock } from 'card'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { Number } from 'form'

import { FormGroup, Input } from '../../utils'

import { isRetentionsMissing } from '.'

export default decorate([
  provideState({
    effects: {
      initialize() {
        this.props.retentions.forEach(({ valuePath }) => {
          this.effects[`set${valuePath}`] = value => {
            this.effects.setSchedule({
              [valuePath]: defined(value, null),
            })
          }
        })
      },
      setSchedule: (_, params) => (_, { value, onChange }) => {
        onChange({
          ...value,
          ...params,
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
    computed: {
      idInputName: generateId,

      missingRetentions: (_, { value, retentions }) =>
        isRetentionsMissing(value, retentions),
    },
  }),
  injectState,
  ({ effects, state, retentions, value: schedule }) => (
    <Card>
      <CardBlock>
        {state.missingRetentions && (
          <div className='text-danger text-md-center'>
            <Icon icon='alarm' /> {_('retentionNeeded')}
          </div>
        )}
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
        {/* retentions effect are defined on initialize() */}
        {retentions.map(({ name, valuePath }) => (
          <FormGroup key={valuePath}>
            <label>
              <strong>{name}</strong>
            </label>
            <Number
              min='0'
              onChange={effects[`set${valuePath}`]}
              value={schedule[valuePath]}
            />
          </FormGroup>
        ))}
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
