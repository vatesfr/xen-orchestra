import React, { Component } from 'react'
import _ from 'messages'
import forEach from 'lodash/forEach'
import includes from 'lodash/includes'
import join from 'lodash/join'
import later from 'later'
import map from 'lodash/map'
import sortedIndex from 'lodash/sortedIndex'
import { Range } from 'form'
import { FormattedTime } from 'react-intl'

import { Col, Row } from 'grid'
import {
  Panel,
  Tab,
  Tabs
} from 'react-bootstrap-4/lib'
import {
  autobind,
  propTypes
} from 'utils'

// ===================================================================

const NAV_EVERY = 1
const NAV_EACH_SELECTED = 2
const NAV_EVERY_N = 3

const MIN_PREVIEWS = 5
const MAX_PREVIEWS = 20

const MONTHS = [
  [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june'
  ],
  [
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
  ]
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

const WEEK_DAYS = [[
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]]

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
  minute: 'numeric'
}

// ===================================================================

@propTypes({
  cron: propTypes.string.isRequired
})
export class SchedulePreview extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  @autobind
  _handleChange (value) {
    this.setState({
      value
    })
  }

  render () {
    const { props } = this
    const cronSched = later.parse.cron(props.cron)
    const dates = later.schedule(cronSched).next(this.state.value || MIN_PREVIEWS)

    return (
      <div>
        <div className='form-inline container-fluid p-b-1'>
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
  constructor (props) {
    super(props)
    this.state = {}
  }

  get value () {
    return this.state.value
  }

  set value (value) {
    const { onChange } = this.props

    this.setState({
      value
    }, onChange && (() => onChange(value)))
  }

  @autobind
  _handleClick () {
    const { onChange } = this.props
    const value = !this.state.value

    this.setState({
      value
    }, onChange && (() => onChange(value)))
  }

  render () {
    return (
      <td style={{ cursor: 'pointer' }} className={this.state.value ? 'table-success' : ''} onClick={this._handleClick}>
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
  constructor (props) {
    super(props)
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

  @autobind
  _reset () {
    this.value = []
  }

  @autobind
  _handleChange (id, value) {
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
  constructor (props) {
    super(props)
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

  @autobind
  _updateOpen () {
    this.setState({
      open: !this.state.open
    })
  }

  @autobind
  _selectTab (activeKey) {
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
      <div className='card'>
        <button className='card-header btn btn-lg btn-block' onClick={this._updateOpen}>
          {_(`scheduling${type}`)}
        </button>
        <Panel collapsible expanded={state.open}>
          <div className='card-block'>
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
          </div>
        </Panel>
      </div>
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
  onChange: propTypes.func
})
export default class Scheduler extends Component {
  constructor (props) {
    super(props)
    this.cron = {
      minute: '*',
      hour: '*',
      monthDay: '*',
      month: '*',
      weekDay: '*'
    }
  }

  get value () {
    const { cron } = this
    return `${cron.minute} ${cron.hour} ${cron.monthDay} ${cron.month} ${cron.weekDay}`
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
    const { cron } = this
    const { onChange } = this.props

    if (value === 'all') {
      cron[type] = '*'
    } else if (Array.isArray(value)) {
      if (!value.length) {
        cron[type] = '*'
      } else {
        cron[type] = join(
          (type === 'monthDay' || type === 'month')
            ? map(value, (n) => n + 1)
            : value,
          ','
        )
      }
    } else {
      cron[type] = `*/${value}`
    }

    if (onChange) {
      onChange(this.value)
    }
  }

  render () {
    return (
      <div className='card-block'>
        <Row>
          <Col mediumSize={6}>
            <TimePicker
              ref='month'
              type='Month'
              dataRender={_}
              data={MONTHS}
              onChange={(value) => { this._update('month', value) }}
            />
            <TimePicker
              ref='monthDay'
              type='MonthDay'
              data={DAYS}
              onChange={(value) => { this._update('monthDay', value) }}
            />
            <TimePicker
              ref='weekDay'
              type='WeekDay'
              dataRender={_}
              data={WEEK_DAYS}
              onChange={(value) => { this._update('weekDay', value) }}
            />
          </Col>
          <Col mediumSize={6}>
            <TimePicker
              ref='hour'
              type='Hour'
              data={HOURS}
              range={[2, 12]}
              onChange={(value) => { this._update('hour', value) }}
            />
            <TimePicker
              ref='minute'
              type='Minute'
              data={MINS}
              range={[2, 30]}
              onChange={(value) => { this._update('minute', value) }}
            />
          </Col>
        </Row>
      </div>
    )
  }
}
