import forEach from 'lodash/forEach'
import includes from 'lodash/includes'
import join from 'lodash/join'
import later from 'later'
import map from 'lodash/map'
import React from 'react'
import sortedIndex from 'lodash/sortedIndex'
import { FormattedTime } from 'react-intl'
import {
  Tab,
  Tabs
} from 'react-bootstrap-4/lib'

import _ from './intl'
import Component from './base-component'
import propTypes from './prop-types'
import TimezonePicker from './timezone-picker'
import { Card, CardHeader, CardBlock } from './card'
import { Col, Row } from './grid'
import { Range } from './form'

// ===================================================================

const NAV_EVERY = 1
const NAV_EACH_SELECTED = 2
const NAV_EVERY_N = 3

const MIN_PREVIEWS = 5
const MAX_PREVIEWS = 20

const MONTHS = [
  [ 0, 1, 2, 3, 4, 5 ],
  [ 6, 7, 8, 9, 10, 11 ]
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

const WEEK_DAYS = [[ 0, 1, 2, 3, 4, 5, 6 ]]

const HOURS = (() => {
  const hours = []

  for (let i = 0; i < 3; i++) {
    hours[i] = []

    for (let j = 0; j < 8; j++) {
      hours[i].push(8 * i + j)
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

const TIME_FORMAT = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',

  // The scheduling previews use the UTC format,
  // because the cron patterns are relative to timezones.
  //
  // The cron patterns are used with timezones because it exists
  // differents xo-server configurations, it gives a better control
  // on jobs execution.
  timeZone: 'UTC'
}

// ===================================================================

// monthNum: [ 0 : 11 ]
const getMonthName = (monthNum) =>
  <FormattedTime value={new Date(1970, monthNum)} month='long' timeZone='UTC' />

// dayNum: [ 0 : 6 ]
const getDayName = (dayNum) =>
  // January, 1970, 5th => Monday
  <FormattedTime value={new Date(1970, 0, 4 + dayNum)} weekday='long' timeZone='UTC' />

// ===================================================================

@propTypes({
  cronPattern: propTypes.string.isRequired
})
export class SchedulePreview extends Component {
  _handleChange = value => {
    this.setState({
      value
    })
  }

  render () {
    const { props } = this
    const cronSched = later.parse.cron(props.cronPattern)
    const dates = later.schedule(cronSched).next(this.state.value || MIN_PREVIEWS)

    return (
      <div>
        <div className='form-inline p-b-1'>
          <Range min={MIN_PREVIEWS} max={MAX_PREVIEWS} onChange={this._handleChange} />
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

@propTypes({
  children: propTypes.any.isRequired,
  onChange: propTypes.func
})
class ToggleTd extends Component {
  get value () {
    return this.state.value
  }

  set value (value) {
    const { onChange } = this.props

    this.setState({
      value
    }, onChange && (() => onChange(value)))
  }

  _onClick = () => {
    const { onChange } = this.props
    const value = !this.state.value

    this.setState({
      value
    }, onChange && (() => onChange(value)))
  }

  render () {
    return (
      <td style={{ cursor: 'pointer' }} className={this.state.value ? 'table-success' : ''} onClick={this._onClick}>
        {this.props.children}
      </td>
    )
  }
}

// ===================================================================

@propTypes({
  data: propTypes.array.isRequired,
  dataRender: propTypes.func,
  onChange: propTypes.func
})
class TableSelect extends Component {
  constructor () {
    super()
    this.state = {
      value: []
    }
  }

  get value () {
    return this.state.value
  }

  set value (value) {
    const { onChange } = this.props

    forEach(this.refs, (ref, id) => {
      // Don't call ref.input directly because onChange of each ToggleTd is called else!
      ref.setState({
        value: includes(value, +id)
      })
    })

    this.setState({
      value
    }, onChange && (() => onChange(value)))
  }

  _reset = () => {
    this.value = []
  }

  _handleChange = (id, value) => {
    const { onChange } = this.props
    const newValue = this.state.value.slice()

    if (value) {
      newValue.splice(sortedIndex(newValue, id), 0, id)
    } else {
      newValue.splice(sortedIndex(newValue, id), 1)
    }

    this.setState({
      value: newValue
    }, onChange && (() => onChange(newValue)))
  }

  render () {
    const dataRender = this.props.dataRender || ((value) => value)
    const {
      props: {
        data
      }
    } = this
    const { length } = data[0]

    return (
      <div>
        <table className='table table-bordered table-sm'>
          <tbody>
            {map(data, (line, i) => (
              <tr key={i}>
                {map(line, (value, j) => {
                  const id = length * i + j
                  return (
                    <ToggleTd
                      key={id}
                      ref={id}
                      children={dataRender(value)}
                      onChange={(value) => { this._handleChange(id, value) }}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <button className='btn btn-secondary pull-xs-right' onClick={this._reset}>
          {_('selectTableReset')}
        </button>
      </div>
    )
  }
}

// ===================================================================

@propTypes({
  dataRender: propTypes.func,
  onChange: propTypes.func,
  range: propTypes.array,
  type: propTypes.string.isRequired
})
class TimePicker extends Component {
  constructor () {
    super()
    this.state = {
      activeKey: NAV_EVERY
    }
  }

  get value () {
    const { activeKey } = this.state
    const { refs } = this

    if (activeKey === NAV_EVERY) {
      return 'all'
    }

    if (activeKey === NAV_EACH_SELECTED) {
      return refs.select.value
    }

    return refs.range.value
  }

  set value (value) {
    const { refs } = this
    const { onChange } = this.props

    if (value === 'all') {
      this.setState({
        activeKey: NAV_EVERY
      }, onChange && (() => onChange(value)))
    } else if (Array.isArray(value)) {
      this.setState({
        activeKey: NAV_EACH_SELECTED
      })
      refs.select.value = value
    } else {
      this.setState({
        activeKey: NAV_EVERY_N
      })
      refs.range.value = value
    }
  }

  _selectTab = activeKey => {
    const { onChange } = this.props

    this.setState({
      activeKey
    }, onChange && (() => onChange(this.value)))
  }

  render () {
    const {
      props,
      state
    } = this

    const {
      onChange,
      range,
      type
    } = props

    return (
      <Card>
        <CardHeader>
          {_(`scheduling${type}`)}
        </CardHeader>
        <CardBlock>
          <Tabs bsStyle='tabs' activeKey={state.activeKey} onSelect={this._selectTab}>
            <Tab tabClassName='nav-item' eventKey={NAV_EVERY} title={_(`schedulingEvery${type}`)} />
            <Tab tabClassName='nav-item' eventKey={NAV_EACH_SELECTED} title={_(`schedulingEachSelected${type}`)}>
              <TableSelect ref='select' data={props.data} dataRender={props.dataRender} onChange={onChange} />
            </Tab>
            {range &&
              <Tab tabClassName='nav-item' eventKey={NAV_EVERY_N} title={_(`schedulingEveryN${type}`)}>
                <Range ref='range' min={range[0]} max={range[1]} onChange={onChange} />
              </Tab>}
          </Tabs>
        </CardBlock>
      </Card>
    )
  }
}

// ===================================================================

const ID_TO_PICKTIME = [
  'minute',
  'hour',
  'monthDay',
  'month',
  'weekDay'
]

@propTypes({
  defaultCronPattern: propTypes.string,
  defaultTimezone: propTypes.string,
  onChange: propTypes.func
})
export default class Scheduler extends Component {
  constructor () {
    super()
    this.cronPattern = {
      minute: '*',
      hour: '*',
      monthDay: '*',
      month: '*',
      weekDay: '*'
    }
  }

  _getCronPattern () {
    const { cronPattern } = this
    return `${cronPattern.minute} ${cronPattern.hour} ${cronPattern.monthDay} ${cronPattern.month} ${cronPattern.weekDay}`
  }

  get value () {
    return {
      cronPattern: this._getCronPattern(),
      timezone: this.refs.timezonePicker.value
    }
  }

  set value (value) {
    if (!value) {
      value = '* * * * *'
    }

    forEach(value.split(' '), (t, id) => {
      const ref = this.refs[ID_TO_PICKTIME[id]]

      if (t === '*') {
        ref.value = 'all'
      } else if (t.indexOf('/') === 1) {
        ref.value = t.split('/')[1]
      } else {
        ref.value = map(t.split(','), e => +e)
      }
    })
  }

  _update (type, value) {
    const { cronPattern } = this
    const { onChange } = this.props

    if (value === 'all') {
      cronPattern[type] = '*'
    } else if (Array.isArray(value)) {
      if (!value.length) {
        cronPattern[type] = '*'
      } else {
        cronPattern[type] = join(
          (type === 'monthDay' || type === 'month')
            ? map(value, (n) => n + 1)
            : value,
          ','
        )
      }
    } else {
      cronPattern[type] = `*/${value}`
    }

    if (onChange) {
      onChange(this.value)
    }
  }

  _onHourChange = value => this._update('hour', value)
  _onMinuteChange = value => this._update('minute', value)
  _onMonthChange = value => this._update('month', value)
  _onMonthDayChange = value => this._update('monthDay', value)
  _onWeekDayChange = value => this._update('weekDay', value)

  _onTimezoneChange = timezone => {
    const { onChange } = this.props

    if (onChange) {
      onChange(this.value)
    }
  }

  componentDidMount () {
    const { defaultCronPattern } = this.props

    if (defaultCronPattern) {
      this.value = defaultCronPattern
    }
  }

  render () {
    const { defaultTimezone } = this.props

    return (
      <div className='card-block'>
        <Row>
          <Col mediumSize={6}>
            <TimePicker
              ref='month'
              type='Month'
              dataRender={getMonthName}
              data={MONTHS}
              onChange={this._onMonthChange}
            />
            <TimePicker
              ref='monthDay'
              type='MonthDay'
              data={DAYS}
              onChange={this._onMonthDayChange}
            />
            <TimePicker
              ref='weekDay'
              type='WeekDay'
              dataRender={getDayName}
              data={WEEK_DAYS}
              onChange={this._onWeekDayChange}
            />
          </Col>
          <Col mediumSize={6}>
            <TimePicker
              ref='hour'
              type='Hour'
              data={HOURS}
              range={[2, 12]}
              onChange={this._onHourChange}
            />
            <TimePicker
              ref='minute'
              type='Minute'
              data={MINS}
              range={[2, 30]}
              onChange={this._onMinuteChange}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <hr />
            <TimezonePicker ref='timezonePicker' defaultValue={defaultTimezone} onChange={this._onTimezoneChange} />
          </Col>
        </Row>
      </div>
    )
  }
}
