import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { createSchedule } from '@xen-orchestra/cron'
import { forEach, includes, isArray, map, sortedIndex } from 'lodash'
import { FormattedDate, FormattedTime } from 'react-intl'

import _ from './intl'
import Button from './button'
import Component from './base-component'
import TimezonePicker from './timezone-picker'
import Icon from './icon'
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

const MINUTES_RANGE = [2, 30]
const HOURS_RANGE = [2, 12]
const MONTH_DAYS_RANGE = [2, 15]
const MONTHS_RANGE = [2, 6]

const MIN_PREVIEWS = 5
const MAX_PREVIEWS = 20

const MONTHS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]]

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
const getMonthName = monthNum => (
  <FormattedDate value={Date.UTC(1970, monthNum)} month='long' timeZone='UTC' />
)

// dayNum: [ 0 : 6 ]
const getDayName = dayNum => (
  // January, 1970, 5th => Monday
  <FormattedDate
    value={Date.UTC(1970, 0, 4 + dayNum)}
    weekday='long'
    timeZone='UTC'
  />
)

// ===================================================================

export class SchedulePreview extends Component {
  static propTypes = {
    cronPattern: PropTypes.string.isRequired,
    timezone: PropTypes.string,
  }

  componentDidMount () {
    getXoServerTimezone.then(serverTimezone => {
      this.setState({
        defaultTimezone: serverTimezone,
      })
    })
  }

  render () {
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
            value={+value}
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

  render () {
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

class TableSelect extends Component {
  static propTypes = {
    labelId: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    optionRenderer: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.array.isRequired,
  }

  static defaultProps = {
    optionRenderer: value => value,
  }

  _reset = () => {
    this.props.onChange([])
  }

  _handleChange = (tdId, tdValue) => {
    const { props } = this

    const newValue = props.value.slice()
    const index = sortedIndex(newValue, tdId)

    if (tdValue) {
      // Add
      if (newValue[index] !== tdId) {
        newValue.splice(index, 0, tdId)
      }
    } else {
      // Remove
      if (newValue[index] === tdId) {
        newValue.splice(index, 1)
      }
    }

    props.onChange(newValue)
  }

  render () {
    const { labelId, options, optionRenderer, value } = this.props

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
                    onChange={this._handleChange}
                    value={includes(value, tdOption)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Button className='pull-right' onClick={this._reset}>
          {_(`selectTableAll${labelId}`)}{' '}
          {value && !value.length && <Icon icon='success' />}
        </Button>
      </div>
    )
  }
}

// ===================================================================

// "2,7" => [2,7]   "*/2" => 2   "*" => []
const cronToValue = (cron, range) => {
  if (cron.indexOf('/') === 1) {
    return +cron.split('/')[1]
  }

  if (cron === '*') {
    return []
  }

  return map(cron.split(','), Number)
}

// [2,7] => "2,7"   2 => "*/2"   [] => "*"
const valueToCron = value => {
  if (!isArray(value)) {
    return `*/${value}`
  }

  if (!value.length) {
    return '*'
  }

  return value.join(',')
}

class TimePicker extends Component {
  static propTypes = {
    headerAddon: PropTypes.node,
    optionRenderer: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    range: PropTypes.array,
    labelId: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
  }

  _update = cron => {
    const { tableValue, rangeValue } = this.state

    const newValue = cronToValue(cron)
    const periodic = !isArray(newValue)

    this.setState({
      periodic,
      tableValue: periodic ? tableValue : newValue,
      rangeValue: periodic ? newValue : rangeValue,
    })
  }

  componentWillReceiveProps (props) {
    if (props.value !== this.props.value) {
      this._update(props.value)
    }
  }

  componentDidMount () {
    this._update(this.props.value)
  }

  _onChange = value => {
    this.props.onChange(valueToCron(value))
  }

  _tableTab = () => this._onChange(this.state.tableValue || [])
  _periodicTab = () =>
    this._onChange(this.state.rangeValue || this.props.range[0])

  render () {
    const { headerAddon, labelId, options, optionRenderer, range } = this.props

    const { periodic, tableValue, rangeValue } = this.state

    return (
      <Card>
        <CardHeader>
          {_(`scheduling${labelId}`)}
          {headerAddon}
        </CardHeader>
        <CardBlock>
          {range && (
            <ul className='nav nav-tabs mb-1'>
              <li className='nav-item'>
                <a
                  onClick={this._tableTab}
                  className={classNames('nav-link', !periodic && 'active')}
                  style={CLICKABLE}
                >
                  {_(`schedulingEachSelected${labelId}`)}
                </a>
              </li>
              <li className='nav-item'>
                <a
                  onClick={this._periodicTab}
                  className={classNames('nav-link', periodic && 'active')}
                  style={CLICKABLE}
                >
                  {_(`schedulingEveryN${labelId}`)}
                </a>
              </li>
            </ul>
          )}
          {periodic ? (
            <Range
              ref='range'
              min={range[0]}
              max={range[1]}
              onChange={this._onChange}
              value={rangeValue}
            />
          ) : (
            <TableSelect
              labelId={labelId}
              onChange={this._onChange}
              options={options}
              optionRenderer={optionRenderer}
              value={tableValue || []}
            />
          )}
        </CardBlock>
      </Card>
    )
  }
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

  componentWillReceiveProps (props) {
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
    const isMonthDayPattern = !this.state.weekDayMode || includes(cron, '/')

    this.props.onChange([
      isMonthDayPattern ? cron : '*',
      isMonthDayPattern ? '*' : cron,
    ])
  }

  render () {
    const { monthDayPattern, weekDayPattern } = this.props
    const { weekDayMode } = this.state

    const dayModeToggle = (
      <Tooltip
        content={_(
          weekDayMode ? 'schedulingSetMonthDayMode' : 'schedulingSetWeekDayMode'
        )}
      >
        <span className='pull-right'>
          <Toggle
            onChange={this._setWeekDayMode}
            iconSize={1}
            value={weekDayMode}
          />
        </span>
      </Tooltip>
    )

    return (
      <TimePicker
        headerAddon={dayModeToggle}
        key={weekDayMode ? 'week' : 'month'}
        labelId='Day'
        optionRenderer={weekDayMode ? getDayName : undefined}
        options={weekDayMode ? WEEK_DAYS : DAYS}
        onChange={this._onChange}
        range={MONTH_DAYS_RANGE}
        setWeekDayMode={this._setWeekDayMode}
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

  constructor (props) {
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
    this._dayChange = ([monthDay, weekDay]) =>
      this._onCronChange({ monthDay, weekDay })
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

  render () {
    const cronPatternArr = this._getCronPattern().split(' ')
    const timezone = this._getTimezone()

    return (
      <div className='card-block'>
        <Row>
          <Col largeSize={6}>
            <TimePicker
              labelId='Month'
              optionRenderer={getMonthName}
              options={MONTHS}
              onChange={this._monthChange}
              range={MONTHS_RANGE}
              value={cronPatternArr[PICKTIME_TO_ID['month']]}
            />
          </Col>
          <Col largeSize={6}>
            <DayPicker
              onChange={this._dayChange}
              monthDayPattern={cronPatternArr[PICKTIME_TO_ID['monthDay']]}
              weekDayPattern={cronPatternArr[PICKTIME_TO_ID['weekDay']]}
            />
          </Col>
        </Row>
        <Row>
          <Col largeSize={6}>
            <TimePicker
              labelId='Hour'
              options={HOURS}
              range={HOURS_RANGE}
              onChange={this._hourChange}
              value={cronPatternArr[PICKTIME_TO_ID['hour']]}
            />
          </Col>
          <Col largeSize={6}>
            <TimePicker
              labelId='Minute'
              options={MINS}
              range={MINUTES_RANGE}
              onChange={this._minuteChange}
              value={cronPatternArr[PICKTIME_TO_ID['minute']]}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <hr />
            <TimezonePicker
              value={timezone}
              onChange={this._onTimezoneChange}
            />
          </Col>
        </Row>
      </div>
    )
  }
}
