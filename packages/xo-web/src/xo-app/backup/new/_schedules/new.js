import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { Number } from 'form'

import { FormGroup, Input } from '../../utils'

import { areRetentionsMissing } from '.'

import ScheduleHealthCheck from '../healthCheck/ScheduleHealthCheck'

export default decorate([
  provideState({
    effects: {
      setSchedule:
        (_, params) =>
        (_, { value, onChange }) => {
          onChange({
            ...value,
            ...params,
          })
        },
      setCronTimezone:
        ({ setSchedule }, { cronPattern: cron, timezone }) =>
        () => {
          setSchedule({
            cron,
            timezone,
          })
        },
      setName:
        ({ setSchedule }, { target: { value } }) =>
        () => {
          setSchedule({
            name: value.trim() === '' ? null : value,
          })
        },
      setRetention({ setSchedule }, value, { name }) {
        setSchedule({
          [name]: value,
        })
      },
      toggleHealthCheck:
        ({ setSchedule }, { target: { checked } }) =>
        state =>
          setSchedule({
            healthCheckVmsWithTags: checked ? [] : undefined,
            healthCheckSr: checked ? state.healthCheckSr : undefined,
          }),
      setHealthCheckSr: ({ setSchedule }, sr) => setSchedule({ healthCheckSr: sr.id }),
      setHealthCheckTags: ({ setSchedule }, tags) =>
        setSchedule({
          healthCheckVmsWithTags: tags,
        }),
    },
    computed: {
      idInputName: generateId,

      missingRetentions: (_, { value, retentions }) => areRetentionsMissing(value, retentions),
    },
  }),
  injectState,
  ({ effects, state, retentions, value: schedule, withHealthCheck = false }) => (
    <div>
      {state.missingRetentions && (
        <div className='text-danger text-md-center'>
          <Icon icon='alarm' /> {_('retentionNeeded')}
        </div>
      )}
      <FormGroup>
        <label htmlFor={state.idInputName}>
          <strong>{_('formName')}</strong>
        </label>
        <Input id={state.idInputName} onChange={effects.setName} value={schedule.name} />
      </FormGroup>
      {retentions.map(({ name, valuePath }) => (
        <FormGroup key={valuePath}>
          <label>
            <strong>{name}</strong>
          </label>
          <Number data-name={valuePath} min='0' onChange={effects.setRetention} required value={schedule[valuePath]} />
        </FormGroup>
      ))}
      {withHealthCheck && (
        <ScheduleHealthCheck
          setHealthCheckSr={effects.setHealthCheckSr}
          setHealthCheckTags={effects.setHealthCheckTags}
          schedule={schedule}
          toggleHealthCheck={effects.toggleHealthCheck}
        />
      )}
      <Scheduler onChange={effects.setCronTimezone} cronPattern={schedule.cron} timezone={schedule.timezone} />
      <SchedulePreview cronPattern={schedule.cron} timezone={schedule.timezone} />
    </div>
  ),
])
