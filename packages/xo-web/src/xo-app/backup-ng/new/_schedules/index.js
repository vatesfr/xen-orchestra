import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import moment from 'moment-timezone'
import PropTypes from 'prop-types'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import UserError from 'user-error'
import { Card, CardBlock, CardHeader } from 'card'
import { form } from 'modal'
import { generateRandomId } from 'utils'
import { injectState, provideState } from 'reaclette'
import { Map } from 'immutable'

import { FormFeedback } from '../../utils'

import Modal from './modal'

const DEFAULT_SCHEDULE = {
  cron: '0 0 * * *',
  timezone: moment.tz.guess(),
}

const setDefaultRetentions = (schedule, retentions) => {
  retentions.forEach(({ defaultValue, valuePath }) => {
    if (schedule[valuePath] === undefined) {
      schedule[valuePath] = defaultValue
    }
  })
  return schedule
}

export const areRetentionsMissing = (value, retentions) =>
  retentions.length !== 0 &&
  !retentions.some(({ valuePath }) => value[valuePath] > 0)

const COLUMNS = [
  {
    valuePath: 'name',
    name: _('scheduleName'),
    default: true,
  },
  {
    itemRenderer: (schedule, { toggleScheduleState }) => (
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
    valuePath: 'cron',
    name: _('scheduleCron'),
  },
  {
    valuePath: 'timezone',
    name: _('scheduleTimezone'),
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: (schedule, { showModal }) => showModal(schedule),
    icon: 'edit',
    label: _('scheduleEdit'),
    level: 'primary',
  },
  {
    handler: ({ id }, { deleteSchedule }) => deleteSchedule(id),
    icon: 'delete',
    label: _('scheduleDelete'),
    level: 'danger',
  },
]

const Schedules = decorate([
  provideState({
    effects: {
      deleteSchedule: (_, id) => (state, props) => {
        props.handlerSchedules(state.immutableSchedules.delete(id).toObject())
        props.handlerSettings(state.immutableSettings.delete(id).toObject())
      },
      showModal: (
        effects,
        { id = generateRandomId(), name, cron, timezone } = DEFAULT_SCHEDULE
      ) => async (state, props) => {
        const {
          cron: newCron,
          name: newName,
          timezone: newTimezone,
          ...newSettings
        } = await form({
          defaultValue: setDefaultRetentions(
            { cron, name, timezone, ...state.immutableSettings.get(id) },
            state.retentions
          ),
          render: props => <Modal retentions={state.retentions} {...props} />,
          header: (
            <span>
              <Icon icon='schedule' /> {_('schedule')}
            </span>
          ),
          size: 'large',
          handler: value => {
            if (areRetentionsMissing(value, state.retentions)) {
              throw new UserError(_('newScheduleError'), _('retentionNeeded'))
            }
            return value
          },
        })

        props.handlerSchedules(
          state.immutableSchedules
            .update(id, schedule => ({
              ...schedule,
              cron: newCron,
              id,
              name: newName,
              timezone: newTimezone,
            }))
            .toObject()
        )
        props.handlerSettings(
          state.immutableSettings
            .update(id, setting => ({
              ...setting,
              ...newSettings,
            }))
            .toObject()
        )
      },
      toggleScheduleState: (_, id) => (
        { immutableSchedules },
        { handlerSchedules }
      ) => {
        handlerSchedules(
          immutableSchedules
            .update(id, schedule => ({
              ...schedule,
              enabled: !schedule.enabled,
            }))
            .toObject()
        )
      },
    },
    computed: {
      columns: (_, { retentions }) => [
        ...COLUMNS,
        ...retentions.map(({ defaultValue, ...props }) => props),
      ],
      immutableSchedules: (_, { schedules }) => Map(schedules),
      immutableSettings: (_, { settings }) => Map(settings),
      rowTransform: (_, { settings = {}, retentions }) => schedule => {
        schedule = { ...schedule, ...settings[schedule.id] }
        return setDefaultRetentions(schedule, retentions)
      },
    },
  }),
  injectState,
  ({ state, effects, schedules, missingSchedules, missingRetentions }) => (
    <FormFeedback
      component={Card}
      error={missingSchedules || missingRetentions}
      message={
        missingSchedules ? _('missingSchedules') : _('missingRetentions')
      }
    >
      <CardHeader>
        {_('backupSchedules')}*
        <ActionButton
          btnStyle='primary'
          className='pull-right'
          handler={effects.showModal}
          icon='add'
          tooltip={_('scheduleAdd')}
        />
      </CardHeader>
      <CardBlock>
        <SortedTable
          collection={schedules}
          columns={state.columns}
          data-deleteSchedule={effects.deleteSchedule}
          data-showModal={effects.showModal}
          data-toggleScheduleState={effects.toggleScheduleState}
          individualActions={INDIVIDUAL_ACTIONS}
          rowTransform={state.rowTransform}
        />
      </CardBlock>
    </FormFeedback>
  ),
])

Schedules.propTypes = {
  handlerSchedules: PropTypes.func.isRequired,
  handlerSettings: PropTypes.func.isRequired,
  missingRetentions: PropTypes.bool,
  missingSchedules: PropTypes.bool,
  retentions: PropTypes.arrayOf(
    PropTypes.shape({
      defaultValue: PropTypes.number,
      name: PropTypes.node.isRequired,
      valuePath: PropTypes.string.isRequired,
    })
  ).isRequired,
  schedules: PropTypes.object,
  settings: PropTypes.object,
}

export { Schedules as default }
