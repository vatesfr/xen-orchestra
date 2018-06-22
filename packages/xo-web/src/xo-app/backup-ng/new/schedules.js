import _ from 'intl'
import ActionButton from 'action-button'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import { Card, CardBlock, CardHeader } from 'card'
import { injectState, provideState } from '@julien-f/freactal'
import { isEmpty, find, size } from 'lodash'

import NewSchedule from './new-schedule'
import { FormFeedback } from './utils'

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
      disabledDeletion: state => size(state.schedules) <= 1,
      disabledEdition: state =>
        state.editionMode !== undefined ||
        (!state.exportMode && !state.copyMode && !state.snapshotMode),
      error: state => find(FEEDBACK_ERRORS, error => state[error]),
      individualActions: (
        { disabledDeletion, disabledEdition },
        { effects: { deleteSchedule, editSchedule } }
      ) => [
        {
          disabled: disabledEdition,
          handler: editSchedule,
          icon: 'edit',
          label: _('scheduleEdit'),
          level: 'primary',
        },
        {
          disabled: disabledDeletion,
          handler: deleteSchedule,
          icon: 'delete',
          label: _('scheduleDelete'),
          level: 'danger',
        },
      ],
      rowTransform: ({ settings }) => schedule => {
        const { exportRetention, copyRetention, snapshotRetention } =
          settings[schedule.id] || {}

        return {
          ...schedule,
          exportRetention,
          copyRetention,
          snapshotRetention,
        }
      },
      schedulesColumns: (state, { effects: { toggleScheduleState } }) => {
        const columns = [
          {
            itemRenderer: _ => _.name,
            sortCriteria: 'name',
            name: _('scheduleName'),
            default: true,
          },
          {
            itemRenderer: schedule => (
              <StateButton
                disabledLabel={_('stateDisabled')}
                disabledTooltip={_('logIndicationToEnable')}
                enabledLabel={_('stateEnabled')}
                enabledTooltip={_('logIndicationToDisable')}
                handler={toggleScheduleState}
                handlerParam={schedule.id}
                state={schedule.enabled}
              />
            ),
            sortCriteria: 'enabled',
            name: _('state'),
          },
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
          {isEmpty(state.schedules) ? (
            <p className='text-md-center'>{_('noSchedules')}</p>
          ) : (
            <SortedTable
              collection={state.schedules}
              columns={state.schedulesColumns}
              individualActions={state.individualActions}
              rowTransform={state.rowTransform}
            />
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
