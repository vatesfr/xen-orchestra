import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import Tooltip from 'tooltip'
import { Card, CardBlock } from 'card'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { Number } from 'form'

import ScheduleHealthCheck from './healthCheck/ScheduleHealthCheck'

import { FormGroup, Input } from './../utils'

const New = decorate([
  provideState({
    computed: {
      forceFullBackup: (_, { value }) => value.fullInterval === 1,
      formId: generateId,
      idInputName: generateId,
    },
    effects: {
      setSchedule:
        (_, params) =>
        (_, { value, onChange }) => {
          onChange({
            ...value,
            ...params,
          })
        },
      setExportRetention:
        ({ setSchedule }, exportRetention) =>
        () => {
          setSchedule({
            exportRetention,
          })
        },
      setCopyRetention:
        ({ setSchedule }, copyRetention) =>
        () => {
          setSchedule({
            copyRetention,
          })
        },
      setSnapshotRetention:
        ({ setSchedule }, snapshotRetention) =>
        () => {
          setSchedule({
            snapshotRetention,
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
      setHealthCheckTags({ setSchedule }, tags) {
        setSchedule({
          healthCheckVmsWithTags: tags,
        })
      },
      toggleForceFullBackup({ setSchedule }) {
        setSchedule({
          fullInterval: this.state.forceFullBackup ? undefined : 1,
        })
      },
      toggleHealthCheck({ setSchedule }, { target: { checked } }) {
        setSchedule({
          healthCheckVmsWithTags: checked ? [] : undefined,
          healthCheckSr: checked ? this.state.healthCheckSr : undefined,
        })
      },
      setHealthCheckSr({ setSchedule }, sr) {
        setSchedule({
          healthCheckSr: sr.id,
        })
      },
    },
  }),
  injectState,
  ({ effects, missingRetentions, modes, showRetentionWarning, state, value: schedule }) => (
    <Card>
      <CardBlock>
        {missingRetentions && (
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
        {modes.exportMode && (
          <FormGroup>
            <label>
              <strong>{_('scheduleExportRetention')}</strong>
            </label>{' '}
            {showRetentionWarning && (
              <Tooltip content={_('deltaChainRetentionWarning')}>
                <Icon icon='error' />
              </Tooltip>
            )}
            <Number min='0' onChange={effects.setExportRetention} value={schedule.exportRetention} required />
          </FormGroup>
        )}
        {modes.copyMode && (
          <FormGroup>
            <label>
              <strong>{_('scheduleCopyRetention')}</strong>
            </label>
            <Number min='0' onChange={effects.setCopyRetention} value={schedule.copyRetention} required />
          </FormGroup>
        )}
        {modes.snapshotMode && (
          <FormGroup>
            <label>
              <strong>{_('snapshotRetention')}</strong>
            </label>
            <Number min='0' onChange={effects.setSnapshotRetention} value={schedule.snapshotRetention} required />
          </FormGroup>
        )}
        <ScheduleHealthCheck
          schedule={schedule}
          toggleHealthCheck={effects.toggleHealthCheck}
          setHealthCheckSr={effects.setHealthCheckSr}
          setHealthCheckTags={effects.setHealthCheckTags}
        />
        {modes.isDelta && (
          <FormGroup>
            <label>
              <strong>{_('forceFullBackup')}</strong>{' '}
              <input checked={state.forceFullBackup} onChange={effects.toggleForceFullBackup} type='checkbox' />
            </label>
          </FormGroup>
        )}
        <Scheduler onChange={effects.setCronTimezone} cronPattern={schedule.cron} timezone={schedule.timezone} />
        <SchedulePreview cronPattern={schedule.cron} timezone={schedule.timezone} />
      </CardBlock>
    </Card>
  ),
])

New.propTypes = {
  missingRetentions: PropTypes.bool,
  modes: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired,
}

export { New as default }
