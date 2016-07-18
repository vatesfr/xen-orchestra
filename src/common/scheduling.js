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

// By default later use UTC but we use this line for futures versions.
later.date.UTC()

// ===================================================================

const NAV_EACH_SELECTED = 1
const NAV_EVERY_N = 2

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

const PICKTIME_TO_ID = {
  minute: 0,
  hour: 1,
  monthDay: 2,
  month: 3,
  weekDay: 4
}

const TIME_FORMAT = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',

  // The timezone is not significant for displaying the date previews
  // as long as it is the same used to generate the next occurrences
  // from the cron patterns.

  // Therefore we can use UTC everywhere and say to the user that the
  // previews are in the configured timezone.
  timeZone: 'UTC'
}

// ===================================================================

// monthNum: [ 0 : 11 ]
const getMonthName = (monthNum) =>
  <FormattedTime value={new Date(1970, monthNum)} month='long' />

// dayNum: [ 0 : 6 ]
const getDayName = (dayNum) =>
  // January, 1970, 5th => Monday
  <FormattedTime value={new Date(1970, 0, 4 + dayNum)} weekday='long' />

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
    const { cronPattern } = this.props
    const cronSched = later.parse.cron(cronPattern)
    const dates = later.schedule(cronSched).next(this.state.value || MIN_PREVIEWS)

    return (
      <div>
        <div className='alert alert-info' role='alert'>
          {_('cronPattern')} <strong>{cronPattern}</strong>
        </div>
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
  onChange: propTypes.func.isRequired,
  tdId: propTypes.number.isRequired,
  value: propTypes.bool.isRequired
})
class ToggleTd extends Component {
  _onClick = () => {
    const { props } = this
    props.onChange(props.tdId, !props.value)
  }

  render () {
    const { props } = this
    return (
      <td style={{ cursor: 'pointer' }} className={props.value ? 'table-success' : ''} onClick={this._onClick}>
        {props.children}
      </td>
    )
  }
}

// ===================================================================

@propTypes({
  options: propTypes.array.isRequired,
  optionsRenderer: propTypes.func,
  onChange: propTypes.func.isRequired,
  value: propTypes.array.isRequired
})
class TableSelect extends Component {
  static defaultProps = {
    optionsRenderer: value => value
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
    const {
      options,
      optionsRenderer,
      value
    } = this.props
    const { length } = options[0]

    return (
      <div>
        <table className='table table-bordered table-sm'>
          <tbody>
            {map(options, (line, i) => (
              <tr key={i}>
                {map(line, (tdOption, j) => {
                  const tdId = length * i + j
                  return (
                    <ToggleTd
                      children={optionsRenderer(tdOption)}
                      tdId={tdId}
                      key={tdId}
                      onChange={this._handleChange}
                      value={includes(value, tdId)}
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
  optionsRenderer: propTypes.func,
  onChange: propTypes.func.isRequired,
  range: propTypes.array,
  labelId: propTypes.string.isRequired,
  value: propTypes.any.isRequired
})
class TimePicker extends Component {
  constructor () {
    super()
    this.state = {
      activeKey: NAV_EACH_SELECTED,
      tableValue: []
    }
  }

  _update (props) {
    const { refs } = this
    const { value } = props

    if (value.indexOf('/') === 1) {
      this.setState({
        activeKey: NAV_EVERY_N
      })
      refs.range.value = value.split('/')[1]
    } else {
      this.setState({
        activeKey: NAV_EACH_SELECTED,
        tableValue: value === '*'
          ? []
          : map(value.split(','), e => +e)
      })
    }
  }

  componentWillMount () {
    this._update(this.props)
  }

  componentWillReceiveProps (props) {
    this._update(props)
  }

  _selectTab = activeKey => {
    this.setState({
      activeKey
    }, () => {
      const { activeKey, tableValue } = this.state
      const { onChange } = this.props
      const { refs } = this

      if (activeKey === NAV_EACH_SELECTED) {
        onChange(tableValue)
      } else {
        onChange(refs.range.value)
      }
    })
  }

  _handleTableValue = tableValue => {
    this.setState({
      tableValue
    }, () => this.props.onChange(tableValue))
  }

  render () {
    const {
      onChange,
      options,
      optionsRenderer,
      range,
      labelId
    } = this.props
    const { tableValue } = this.state

    const tableSelect = (
      <TableSelect
        onChange={this._handleTableValue}
        options={options}
        optionsRenderer={optionsRenderer}
        value={tableValue}
      />
    )

    return (
      <Card>
        <CardHeader>
          {_(`scheduling${labelId}`)}
        </CardHeader>
        <CardBlock>
          {range
            ? (
            <Tabs bsStyle='tabs' activeKey={this.state.activeKey} onSelect={this._selectTab}>
              <Tab tabClassName='nav-item' eventKey={NAV_EACH_SELECTED} title={_(`schedulingEachSelected${labelId}`)}>
                {tableSelect}
              </Tab>
              <Tab tabClassName='nav-item' eventKey={NAV_EVERY_N} title={_(`schedulingEveryN${labelId}`)}>
                <Range ref='range' min={range[0]} max={range[1]} onChange={onChange} />
              </Tab>
            </Tabs>
            ) : tableSelect
          }
        </CardBlock>
      </Card>
    )
  }
}

// ===================================================================

@propTypes({
  cronPattern: propTypes.string.isRequired,
  onChange: propTypes.func,
  timezone: propTypes.string
})
export default class Scheduler extends Component {
  _update (type, value) {
    if (Array.isArray(value)) {
      if (!value.length) {
        value = '*'
      } else {
        value = join(
          (type === 'monthDay' || type === 'month')
            ? map(value, n => n + 1)
            : value,
          ','
        )
      }
    } else {
      value = `*/${value}`
    }

    const { props } = this
    const cronPattern = props.cronPattern.split(' ')
    cronPattern[PICKTIME_TO_ID[type]] = value

    this.props.onChange({
      cronPattern: cronPattern.join(' '),
      timezone: props.timezone
    })
  }

  _onHourChange = value => this._update('hour', value)
  _onMinuteChange = value => this._update('minute', value)
  _onMonthChange = value => this._update('month', value)
  _onMonthDayChange = value => this._update('monthDay', value)
  _onWeekDayChange = value => this._update('weekDay', value)

  _onTimezoneChange = timezone => {
    const { props } = this
    props.onChange({
      cronPattern: props.cronPattern,
      timezone
    })
  }

  render () {
    const {
      cronPattern,
      timezone
    } = this.props
    const cronPatternArr = cronPattern.split(' ')

    return (
      <div className='card-block'>
        <Row>
          <Col mediumSize={6}>
            <TimePicker
              labelId='Month'
              optionsRenderer={getMonthName}
              options={MONTHS}
              onChange={this._onMonthChange}
              value={cronPatternArr[PICKTIME_TO_ID['month']]}
            />
            <TimePicker
              labelId='MonthDay'
              options={DAYS}
              onChange={this._onMonthDayChange}
              value={cronPatternArr[PICKTIME_TO_ID['monthDay']]}
            />
            <TimePicker
              labelId='WeekDay'
              optionsRenderer={getDayName}
              options={WEEK_DAYS}
              onChange={this._onWeekDayChange}
              value={cronPatternArr[PICKTIME_TO_ID['weekDay']]}
            />
          </Col>
          <Col mediumSize={6}>
            <TimePicker
              labelId='Hour'
              options={HOURS}
              range={[2, 12]}
              onChange={this._onHourChange}
              value={cronPatternArr[PICKTIME_TO_ID['hour']]}
            />
            <TimePicker
              labelId='Minute'
              options={MINS}
              range={[2, 30]}
              onChange={this._onMinuteChange}
              value={cronPatternArr[PICKTIME_TO_ID['minute']]}
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
