import React from 'react'
import _ from 'messages'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import moment from 'moment'
import sortBy from 'lodash/sortBy'
import times from 'lodash/times'
import { extent } from 'd3-array'
import {
  interpolateViridis,
  scaleSequential
} from 'd3-scale'
import { injectIntl } from 'react-intl'

import Component from '../base-component'
import Tooltip from '../tooltip'
import { propTypes } from '../utils'

import styles from './index.css'

// ===================================================================

const CELL_TIME_FORMAT = {
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  month: 'short',
  second: 'numeric',
  weekday: 'short',
  year: 'numeric'
}

// ===================================================================

const computeColorGen = days => {
  let min = Number.MAX_VALUE
  let max = Number.MIN_VALUE

  forEach(days, day => {
    const [ _min, _max ] = extent(day.hours, value => value && value.value)

    if (_min < min) {
      min = _min
    }

    if (_max > max) {
      max = _max
    }
  })

  return scaleSequential(interpolateViridis).domain([max, min])
}

const computeMissingDays = days => {
  const correctedDays = days.slice()
  const end = days.length - 1
  const hours = new Array(24)

  let a = moment(days[end].timestamp)
  let b

  for (let i = end; i > 0; i--) {
    b = moment(days[i - 1].timestamp)

    const diff = a.diff(b, 'days')

    if (diff > 1) {
      const days = times(diff - 1, () => {
        a.subtract(1, 'days')

        return {
          legend: a.format('DD'),
          hours
        }
      }).reverse()

      correctedDays.splice.apply(
        correctedDays, [i, 0].concat(days)
      )
    }

    a = b
  }

  return correctedDays
}

// ===================================================================

@propTypes({
  cellRenderer: propTypes.func,
  data: propTypes.arrayOf(
    propTypes.shape({
      date: propTypes.number.isRequired,
      value: propTypes.number.isRequired
    })
  ).isRequired
})
@injectIntl
export default class XoWeekHeatmap extends Component {
  static defaultProps = {
    cellRenderer: value => value
  }

  componentWillReceiveProps (nextProps) {
    this._updateDays(nextProps)
  }

  componentWillMount () {
    this._updateDays()
  }

  _updateDays (props = this.props) {
    const {
      data,
      intl: {
        formatTime
      }
    } = props
    const days = {}

    // 1. Compute average per day.
    forEach(data, elem => {
      const date = new Date(elem.date)
      const dayId = moment(date).format('YYYYMMDD')
      const hourId = date.getHours()

      const { value } = elem

      if (!days[dayId]) {
        days[dayId] = {
          legend: moment(date).format('DD'),
          hours: new Array(24),
          timestamp: elem.date
        }
      }

      const { hours } = days[dayId]

      if (!hours[hourId]) {
        hours[hourId] = {
          value,
          nb: 1,
          date: formatTime(date, CELL_TIME_FORMAT)
        }
      } else {
        const hour = hours[hourId]
        hour.value = (hour.value * hour.nb + value) / (hour.nb + 1)
        hour.nb++
      }
    })

    // 2. Compute color gen.
    const colorGen = computeColorGen(days)

    // 3. Define color cells.
    forEach(days, day => {
      forEach(day.hours, hour => {
        if (hour) {
          hour.color = colorGen(hour.value)
        }
      })
    })

    this.setState({
      days: computeMissingDays(
        sortBy(days, 'timestamp')
      )
    })
  }

  render () {
    return (
      <table className={styles.table}>
        <tbody>
          <tr>
            <th />
            {times(24, hour => <th key={hour} className='text-xs-center'>{hour}</th>)}
          </tr>
          {map(this.state.days, (day, key) => (
            <tr key={key}>
              <th>{day.legend}</th>
              {map(day.hours, (hour, key) => (
                <Tooltip
                  className={styles.cell}
                  key={key}
                  style={{ backgroundColor: hour ? hour.color : '#ffffff' }}
                  tagName='td'
                  content={hour
                    ? `${this.props.cellRenderer(hour.value / hour.nb)} (${hour.date})`
                    : _('weekHeatmapNoData')}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}
