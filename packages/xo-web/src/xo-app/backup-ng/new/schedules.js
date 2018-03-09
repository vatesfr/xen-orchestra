import _ from 'intl'
import ActionButton from 'action-button'
import React from 'react'
import SortedTable from 'sorted-table'
import { Card, CardBlock, CardHeader } from 'card'
import { isEmpty, findKey } from 'lodash'
import { injectState, provideState } from '@julien-f/freactal'

import NewSchedule from './new-schedule'
import { FormGroup } from './form'

// ===================================================================

const SCHEDULES_COLUMNS = [
  {
    itemRenderer: _ => _.cron,
    sortCriteria: 'cron',
    name: _('scheduleCron'),
  },
  {
    itemRenderer: _ => _.timezone,
    sortCriteria: 'timezone',
    name: _('scheduleTimezone'),
  },
  {
    itemRenderer: _ => _.exportRetention,
    sortCriteria: _ => _.exportRetention,
    name: _('scheduleExportRetention'),
  },
  {
    itemRenderer: _ => _.snapshotRetention,
    sortCriteria: _ => _.snapshotRetention,
    name: _('scheduleSnapshotRetention'),
  },
]

const SAVED_SCHEDULES_COLUMNS = [
  {
    itemRenderer: _ => _.name,
    sortCriteria: 'name',
    name: _('scheduleName'),
    default: true,
  },
  ...SCHEDULES_COLUMNS,
]

const rowTransform = (schedule, { settings }) => {
  const { exportRetention, snapshotRetention } = settings[schedule.id] || {}

  return {
    ...schedule,
    exportRetention,
    snapshotRetention,
  }
}

const SAVED_SCHEDULES_INDIVIDUAL_ACTIONS = [
  {
    handler: (schedule, { editSchedule }) => editSchedule(schedule),
    label: _('scheduleEdit'),
    icon: 'edit',
    disabled: (_, { disabledEdition }) => disabledEdition,
    level: 'primary',
  },
  {
    handler: (schedule, { deleteSchedule }) => deleteSchedule(schedule.id),
    label: _('scheduleDelete'),
    disabled: (_, { disabledDeletion }) => disabledDeletion,
    icon: 'delete',
    level: 'danger',
  },
]

const NEW_SCHEDULES_INDIVIDUAL_ACTIONS = [
  {
    handler: (schedule, { editNewSchedule, newSchedules }) =>
      editNewSchedule({
        id: findKey(newSchedules, schedule),
        ...schedule,
      }),
    label: _('scheduleEdit'),
    disabled: (_, { disabledEdition }) => disabledEdition,
    icon: 'edit',
    level: 'primary',
  },
  {
    handler: (schedule, { deleteNewSchedule, newSchedules }) =>
      deleteNewSchedule(findKey(newSchedules, schedule)),
    label: _('scheduleDelete'),
    icon: 'delete',
    level: 'danger',
  },
]

// ===================================================================

export default [
  injectState,
  provideState({
    computed: {
      canDeleteSchedule: state => state.schedules.length > 1,
      disabledEdition: state => state.editionMode !== undefined,
    },
  }),
  injectState,
  ({ effects, state }) => (
    <div>
      <Card>
        <CardHeader>
          {_('backupSchedules')}
          <ActionButton
            btnStyle='primary'
            className='pull-right'
            handler={effects.addSchedule}
            disabled={state.disabledEdition}
            icon='add'
            tooltip={_('scheduleAdd')}
          />
        </CardHeader>
        <CardBlock>
          {isEmpty(state.schedules) &&
            isEmpty(state.newSchedules) && (
              <p className='text-md-center'>{_('noSchedules')}</p>
            )}
          {!isEmpty(state.schedules) && (
            <FormGroup>
              <label>
                <strong>{_('backupSavedSchedules')}</strong>
              </label>
              <SortedTable
                collection={state.schedules}
                columns={SAVED_SCHEDULES_COLUMNS}
                data-deleteSchedule={effects.deleteSchedule}
                data-disabledDeletion={!state.canDeleteSchedule}
                data-disabledEdition={state.disabledEdition}
                data-editSchedule={effects.editSchedule}
                data-settings={state.settings}
                individualActions={SAVED_SCHEDULES_INDIVIDUAL_ACTIONS}
                rowTransform={rowTransform}
              />
            </FormGroup>
          )}
          {!isEmpty(state.newSchedules) && (
            <FormGroup>
              <label>
                <strong>{_('backupNewSchedules')}</strong>
              </label>
              <SortedTable
                collection={state.newSchedules}
                columns={SCHEDULES_COLUMNS}
                data-editNewSchedule={effects.editNewSchedule}
                data-deleteNewSchedule={effects.deleteNewSchedule}
                data-newSchedules={state.newSchedules}
                individualActions={NEW_SCHEDULES_INDIVIDUAL_ACTIONS}
              />
            </FormGroup>
          )}
        </CardBlock>
      </Card>
      {state.editionMode !== undefined && (
        <NewSchedule schedule={state.tmpSchedule} />
      )}
    </div>
  ),
].reduceRight((value, decorator) => decorator(value))
