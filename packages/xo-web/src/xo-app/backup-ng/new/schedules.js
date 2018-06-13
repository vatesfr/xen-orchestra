import _ from 'intl'
import ActionButton from 'action-button'
import React from 'react'
import SortedTable from 'sorted-table'
import { Card, CardBlock, CardHeader } from 'card'
import { injectState, provideState } from '@julien-f/freactal'
import { isEmpty, find, findKey, size } from 'lodash'

import NewSchedule from './new-schedule'
import { FormFeedback, FormGroup } from './utils'

// ===================================================================

const rowTransform = (schedule, { settings }) => {
  const { exportRetention, copyRetention, snapshotRetention } =
    settings[schedule.id] || {}

  return {
    ...schedule,
    exportRetention,
    copyRetention,
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

const FEEDBACK_ERRORS = [
  'missingSchedules',
  'missingCopyRetention',
  'missingExportRetention',
  'missingSnapshotRetention',
]

export default [
  injectState,
  provideState({
    computed: {
      disabledDeletion: state =>
        state.schedules.length + size(state.newSchedules) <= 1,
      disabledEdition: state =>
        state.editionMode !== undefined ||
        (!state.exportMode && !state.copyMode && !state.snapshotMode),
      error: state => find(FEEDBACK_ERRORS, error => state[error]),
      schedulesColumns: state => {
        const columns = [
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
        ]

        if (state.exportMode) {
          columns.push({
            itemRenderer: _ => _.exportRetention,
            sortCriteria: _ => _.exportRetention,
            name: _('scheduleExportRetention'),
          })
        }

        if (state.copyMode) {
          columns.push({
            itemRenderer: _ => _.copyRetention,
            sortCriteria: _ => _.copyRetention,
            name: _('scheduleCopyRetention'),
          })
        }

        if (state.snapshotMode) {
          columns.push({
            itemRenderer: _ => _.snapshotRetention,
            sortCriteria: _ => _.snapshotRetention,
            name: _('scheduleSnapshotRetention'),
          })
        }
        return columns
      },
      savedSchedulesColumns: state => [
        {
          itemRenderer: _ => _.name,
          sortCriteria: 'name',
          name: _('scheduleName'),
          default: true,
        },
        ...state.schedulesColumns,
      ],
    },
  }),
  injectState,
  ({ effects, state }) => (
    <div>
      <FormFeedback
        component={Card}
        error={state.showErrors ? state.error !== undefined : undefined}
        message={state.error !== undefined && _(state.error)}
      >
        <CardHeader>
          {_('backupSchedules')}*
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
                columns={state.savedSchedulesColumns}
                data-deleteSchedule={effects.deleteSchedule}
                data-disabledDeletion={state.disabledDeletion}
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
                columns={state.schedulesColumns}
                data-deleteNewSchedule={effects.deleteNewSchedule}
                data-disabledEdition={state.disabledEdition}
                data-editNewSchedule={effects.editNewSchedule}
                data-newSchedules={state.newSchedules}
                individualActions={NEW_SCHEDULES_INDIVIDUAL_ACTIONS}
              />
            </FormGroup>
          )}
        </CardBlock>
      </FormFeedback>
      {state.editionMode !== undefined && (
        <NewSchedule
          copyMode={state.copyMode}
          exportMode={state.exportMode}
          schedule={state.tmpSchedule}
          snapshotMode={state.snapshotMode}
        />
      )}
    </div>
  ),
].reduceRight((value, decorator) => decorator(value))
