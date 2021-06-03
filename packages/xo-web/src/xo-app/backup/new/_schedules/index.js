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
import { get } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'

import { FormFeedback } from '../../utils'

import NewSchedule from './new'

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
  retentions.length !== 0 && !retentions.some(({ valuePath }) => value[valuePath] > 0)

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
        const schedules = { ...props.schedules }
        delete schedules[id]
        props.handlerSchedules(schedules)

        const settings = { ...props.settings }
        delete settings[id]
        props.handlerSettings(settings)
      },
      showModal:
        (effects, { id = generateRandomId(), name, cron, timezone } = DEFAULT_SCHEDULE) =>
        async (state, props) => {
          const schedule = get(() => props.schedules[id])
          const setting = get(() => props.settings[id])

          const {
            cron: newCron,
            name: newName,
            timezone: newTimezone,
            ...newSetting
          } = await form({
            defaultValue: setDefaultRetentions({ cron, name, timezone, ...setting }, state.retentions),
            render: props => <NewSchedule retentions={state.retentions} {...props} />,
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

          props.handlerSchedules({
            ...props.schedules,
            [id]: {
              ...schedule,
              cron: newCron,
              id,
              name: newName,
              timezone: newTimezone,
            },
          })
          props.handlerSettings({
            ...props.settings,
            [id]: {
              ...setting,
              ...newSetting,
            },
          })
        },
      toggleScheduleState:
        (_, id) =>
        (state, { handlerSchedules, schedules }) => {
          const schedule = schedules[id]
          handlerSchedules({
            ...schedules,
            [id]: {
              ...schedule,
              enabled: !schedule.enabled,
            },
          })
        },
    },
    computed: {
      columns: (_, { retentions }) => [...COLUMNS, ...retentions.map(({ defaultValue, ...props }) => props)],
      rowTransform:
        (_, { settings = {}, retentions }) =>
        schedule => {
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
      message={missingSchedules ? _('missingSchedules') : _('missingRetentions')}
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
          stateUrlParam='s_schedules'
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
