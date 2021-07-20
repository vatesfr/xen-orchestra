import classNames from 'classnames'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import { createSchedule } from '@xen-orchestra/cron'
import { FormattedDate, FormattedTime } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { flatten, forEach, identity, map, sortedIndex } from 'lodash'

import _ from './intl'
import Button from './button'
import Component from './base-component'
import decorate from './apply-decorators'
import TimezonePicker from './timezone-picker'
import Tooltip from './tooltip'
import { Card, CardHeader, CardBlock } from './card'
import { Col, Row } from './grid'
import { getXoServerTimezone } from './xo'
import { Range, Toggle } from './form'

// ===================================================================

const CLICKABLE = { cursor: 'pointer' }
const PREVIEW_SLIDER_STYLE = { width: '400px' }

// ===================================================================

const UNITS = ['minute', 'hour', 'monthDay', 'month', 'weekDay']

const MIN_PREVIEWS = 5
const MAX_PREVIEWS = 20

const MONTHS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
]

const DAYS = (() => {
  const days = []

  for (let i = 0; i < 4; i++) {
    days[i] = []

    for (let j = 1; j < 8; j++) {
      days[i].push(7 * i + j)
    }
  }

  days.push([29, 30, 31])

  return days
})()

const WEEK_DAYS = [[0, 1, 2], [3, 4, 5], [6]]

const HOURS = (() => {
  const hours = []

  for (let i = 0; i < 4; i++) {
    hours[i] = []

    for (let j = 0; j < 6; j++) {
      hours[i].push(6 * i + j)
    }
  }

  return hours
})()

const MINS = (() => {
  const minutes = []

  for (let i = 0; i < 6; i++) {
    minutes[i] = []

    for (let j = 0; j < 10; j++) {
      minutes[i].push(10 * i + j)
    }
  }

  return minutes
})()

const PICKTIME_TO_ID = {
  minute: 0,
  hour: 1,
  monthDay: 2,
  month: 3,
  weekDay: 4,
}

const TIME_FORMAT = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}

// ===================================================================

// monthNum: [ 0 : 11 ]
const getMonthName = monthNum => <FormattedDate value={Date.UTC(1970, monthNum)} month='long' timeZone='UTC' />

// dayNum: [ 0 : 6 ]
const getDayName = dayNum => (
  // January, 1970, 5th => Monday
  <FormattedDate value={Date.UTC(1970, 0, 4 + dayNum)} weekday='long' timeZone='UTC' />
)

// ===================================================================

export class SchedulePreview extends Component {
  static propTypes = {
    cronPattern: PropTypes.string.isRequired,
    timezone: PropTypes.string,
  }

  componentDidMount() {
    getXoServerTimezone.then(serverTimezone => {
      this.setState({
        defaultTimezone: serverTimezone,
      })
    })
  }

  render() {
    const { defaultTimezone, value } = this.state
    const { cronPattern, timezone = defaultTimezone } = this.props
    const dates = createSchedule(cronPattern, timezone).next(value)

    return (
      <div>
        <div className='alert alert-info' role='alert'>
          {_('cronPattern')} <strong>{cronPattern}</strong>
        </div>
        <div className='mb-1' style={PREVIEW_SLIDER_STYLE}>
          <Range
            min={MIN_PREVIEWS}
            max={MAX_PREVIEWS}
            onChange={this.linkState('value')}
            value={value && +value}
            required
          />
        </div>
        <ul className='list-group'>
          {map(dates, (date, id) => (
            <li className='list-group-item' key={id}>
              <FormattedTime value={date} {...TIME_FORMAT} />
            </li>
          ))}
          <li className='list-group-item'>...</li>
        </ul>
      </div>
    )
  }
}

// ===================================================================

class ToggleTd extends Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
    onChange: PropTypes.func.isRequired,
    tdId: PropTypes.number.isRequired,
    value: PropTypes.bool.isRequired,
  }

  _onClick = () => {
    const { props } = this
    props.onChange(props.tdId, !props.value)
  }

  render() {
    const { props } = this
    return (
      <td
        className={classNames('text-xs-center', props.value && 'table-success')}
        onClick={this._onClick}
        style={CLICKABLE}
      >
        {props.children}
      </td>
    )
  }
}

// ===================================================================

const TableSelect = decorate([
  provideState({
    effects: {
      onChange:
        (_, tdId, add) =>
        (_, { value, onChange, options }) => {
          let newValue = [...value]
          const index = sortedIndex(newValue, tdId)
          if (add) {
            newValue[index] !== tdId && newValue.splice(index, 0, tdId)
          } else if (newValue[index] === tdId) {
            if (newValue.length > 1) {
              newValue.splice(index, 1)
            } else {
              newValue = [options[0][0]]
            }
          }
          onChange(newValue)
        },
      selectAll:
        () =>
        ({ optionsValues }, { onChange }) => {
          onChange(optionsValues)
        },
    },
    computed: {
      optionsValues: (_, { options }) => flatten(options),
    },
  }),
  injectState,
  ({ state, effects, labelId, options, optionRenderer = identity, value }) => {
    let k = 0
    return (
      <div>
        <table className='table table-bordered table-sm'>
          <tbody>
            {map(options, (line, i) => (
              <tr key={i}>
                {map(line, tdOption => (
                  <ToggleTd
                    children={optionRenderer(tdOption)}
                    tdId={tdOption}
                    key={tdOption}
                    onChange={effects.onChange}
                    value={k < value.length && value[k] === tdOption && (++k, true)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Button className='pull-right' onClick={effects.selectAll}>
          {_(`selectTableAll${labelId}`)}
        </Button>
      </div>
    )
  },
])

TableSelect.propTypes = {
  labelId: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  optionRenderer: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array.isRequired,
}

// ===================================================================

const TimePicker = decorate([
  provideState({
    effects: {
      onChange:
        (_, value) =>
        ({ optionsValues }, { onChange }) => {
          if (Array.isArray(value)) {
            value = value.length === optionsValues.length ? '*' : value.join(',')
          } else {
            value = `*/${value}`
          }

          onChange(value)
        },
    },
    computed: {
      maxStep: ({ optionsValues }) => Math.floor(optionsValues.length / 2),
      optionsValues: (_, { options }) => flatten(options),

      // '*' or '*/1' => all values
      // '2,7' => [2,7]
      // '*/2' => [min + 2 * 0, min + 2 * 1, ..., min + 2 * n <= max]
      tableValue: ({ optionsValues, step }, { value }) =>
        step === 1
          ? optionsValues
          : step !== undefined
          ? optionsValues.filter((_, i) => i % step === 0)
          : value.split(',').map(Number),

      // '*' => 1
      // '*/2' => 2
      // otherwise => undefined
      step: (_, { value }) => (value === '*' ? 1 : value.indexOf('/') === 1 ? +value.split('/')[1] : undefined),
    },
  }),
  injectState,
  ({ state, effects, ...props }) => (
    <Card>
      <CardHeader>
        {_(`scheduling${props.labelId}`)}
        {props.headerAddon}
      </CardHeader>
      <CardBlock>
        <TableSelect
          labelId={props.labelId}
          onChange={effects.onChange}
          optionRenderer={props.optionRenderer}
          options={props.options}
          value={state.tableValue}
        />
        <Range max={state.maxStep} min={1} onChange={effects.onChange} value={state.step} />
      </CardBlock>
    </Card>
  ),
])

TimePicker.propTypes = {
  headerAddon: PropTypes.node,
  labelId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  optionRenderer: PropTypes.func,
  options: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
}

const isWeekDayMode = ({ monthDayPattern, weekDayPattern }) => {
  if (monthDayPattern === '*' && weekDayPattern === '*') {
    return
  }

  return weekDayPattern !== '*'
}

class DayPicker extends Component {
  static propTypes = {
    monthDayPattern: PropTypes.string.isRequired,
    weekDayPattern: PropTypes.string.isRequired,
  }

  state = {
    weekDayMode: isWeekDayMode(this.props),
  }

  componentWillReceiveProps(props) {
    const weekDayMode = isWeekDayMode(props)

    if (weekDayMode !== undefined) {
      this.setState({ weekDayMode })
    }
  }

  _setWeekDayMode = weekDayMode => {
    this.props.onChange(['*', '*'])
    this.setState({ weekDayMode })
  }

  _onChange = cron => {
    this.props.onChange(this.state.weekDayMode ? ['*', cron] : [cron, '*'])
  }

  render() {
    const { monthDayPattern, weekDayPattern } = this.props
    const { weekDayMode } = this.state

    const dayModeToggle = (
      <Tooltip content={_(weekDayMode ? 'schedulingSetMonthDayMode' : 'schedulingSetWeekDayMode')}>
        <span className='pull-right'>
          <Toggle onChange={this._setWeekDayMode} iconSize={1} value={weekDayMode} />
        </span>
      </Tooltip>
    )

    return (
      <TimePicker
        headerAddon={dayModeToggle}
        key={weekDayMode ? 'week' : 'month'}
        labelId='Day'
        onChange={this._onChange}
        optionRenderer={weekDayMode ? getDayName : undefined}
        options={weekDayMode ? WEEK_DAYS : DAYS}
        value={weekDayMode ? weekDayPattern : monthDayPattern}
      />
    )
  }
}

// ===================================================================

export default class Scheduler extends Component {
  static propTypes = {
    cronPattern: PropTypes.string,
    onChange: PropTypes.func,
    timezone: PropTypes.string,
    value: PropTypes.shape({
      cronPattern: PropTypes.string.isRequired,
      timezone: PropTypes.string,
    }),
  }

  constructor(props) {
    super(props)

    this._onCronChange = newCrons => {
      const cronPattern = this._getCronPattern().split(' ')
      forEach(newCrons, (cron, unit) => {
        cronPattern[PICKTIME_TO_ID[unit]] = cron
      })

      this.props.onChange({
        cronPattern: cronPattern.join(' '),
        timezone: this._getTimezone(),
      })
    }

    forEach(UNITS, unit => {
      this[`_${unit}Change`] = cron => this._onCronChange({ [unit]: cron })
    })
    this._dayChange = ([monthDay, weekDay]) => this._onCronChange({ monthDay, weekDay })
  }

  _onTimezoneChange = timezone => {
    this.props.onChange({
      cronPattern: this._getCronPattern(),
      timezone,
    })
  }

  _getCronPattern = () => {
    const { value, cronPattern = value.cronPattern } = this.props
    return cronPattern
  }

  _getTimezone = () => {
    const { value, timezone = value && value.timezone } = this.props
    return timezone
  }

  render() {
    const cronPatternArr = this._getCronPattern().split(' ')
    const timezone = this._getTimezone()

    return (
      <div className='card-block'>
        <em>
          <Icon icon='info' /> {_('scheduleDstWarning')}
        </em>
        <Row>
          <Col largeSize={6}>
            <TimePicker
              labelId='Month'
              optionRenderer={getMonthName}
              options={MONTHS}
              onChange={this._monthChange}
              value={cronPatternArr[PICKTIME_TO_ID.month]}
            />
          </Col>
          <Col largeSize={6}>
            <DayPicker
              onChange={this._dayChange}
              monthDayPattern={cronPatternArr[PICKTIME_TO_ID.monthDay]}
              weekDayPattern={cronPatternArr[PICKTIME_TO_ID.weekDay]}
            />
          </Col>
        </Row>
        <Row>
          <Col largeSize={6}>
            <TimePicker
              labelId='Hour'
              options={HOURS}
              onChange={this._hourChange}
              value={cronPatternArr[PICKTIME_TO_ID.hour]}
            />
          </Col>
          <Col largeSize={6}>
            <TimePicker
              labelId='Minute'
              options={MINS}
              onChange={this._minuteChange}
              value={cronPatternArr[PICKTIME_TO_ID.minute]}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <hr />
            <TimezonePicker value={timezone} onChange={this._onTimezoneChange} />
          </Col>
        </Row>
      </div>
    )
  }
}
