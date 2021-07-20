import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import { Card, CardBlock, CardHeader } from 'card'
import { injectState, provideState } from 'reaclette'
import { isEmpty, find } from 'lodash'

import { FormFeedback } from './../utils'

// ===================================================================

const FEEDBACK_ERRORS = [
  'missingSchedules',
  'missingCopyRetention',
  'missingExportRetention',
  'missingSnapshotRetention',
]

export default decorate([
  injectState,
  provideState({
    computed: {
      error: state => find(FEEDBACK_ERRORS, error => state[error]),
      individualActions: ({ disabledEdition }, { effects: { deleteSchedule, showScheduleModal } }) => [
        {
          disabled: disabledEdition,
          handler: showScheduleModal,
          icon: 'edit',
          label: _('scheduleEdit'),
          level: 'primary',
        },
        {
          handler: deleteSchedule,
          icon: 'delete',
          label: _('scheduleDelete'),
          level: 'danger',
        },
      ],
      rowTransform:
        ({ propSettings, settings = propSettings }) =>
        schedule => ({
          ...schedule,
          ...settings.get(schedule.id),
        }),
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

        if (state.isDelta) {
          columns.push({
            itemRenderer: schedule => (schedule.fullInterval === 1 ? _('stateEnabled') : _('stateDisabled')),
            sortCriteria: 'fullInterval',
            name: _('forceFullBackup'),
          })
        }

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
            handler={effects.showScheduleModal}
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
              stateUrlParam='s'
            />
          )}
        </CardBlock>
      </FormFeedback>
    </div>
  ),
])
