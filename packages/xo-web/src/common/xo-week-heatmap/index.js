import PropTypes from 'prop-types'
import React from 'react'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import moment from 'moment'
import sortBy from 'lodash/sortBy'
import times from 'lodash/times'
import { extent, interpolateViridis, scaleSequential } from 'd3'
import { FormattedTime } from 'react-intl'

import _ from '../intl'
import Component from '../base-component'
import Tooltip from '../tooltip'

import styles from './index.css'

// ===================================================================

const DAY_TIME_FORMAT = {
  day: 'numeric',
  month: 'numeric',
}

// ===================================================================

const computeColorGen = days => {
  let min = Number.MAX_VALUE
  let max = Number.MIN_VALUE

  forEach(days, day => {
    const [_min, _max] = extent(day.hours, value => value && value.value)

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
      const missingDays = times(diff - 1, () => ({
        hours,
        timestamp: a.subtract(1, 'days').valueOf(),
      })).reverse()

      correctedDays.splice.apply(correctedDays, [i, 0].concat(missingDays))
    }

    a = b
  }

  return correctedDays
}

// ===================================================================

export default class XoWeekHeatmap extends Component {
  static propTypes = {
    cellRenderer: PropTypes.func,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.number.isRequired,
        value: PropTypes.number.isRequired,
      })
    ).isRequired,
  }

  static defaultProps = {
    cellRenderer: value => value,
  }

  componentWillReceiveProps(nextProps) {
    this._updateDays(nextProps.data)
  }

  componentWillMount() {
    this._updateDays(this.props.data)
  }

  _updateDays(data) {
    const days = {}

    // 1. Compute average per day.
    forEach(data, elem => {
      const date = new Date(elem.date)
      const dayId = moment(date).format('YYYYMMDD')
      const hourId = date.getHours()

      const { value } = elem

      if (!days[dayId]) {
        days[dayId] = {
          hours: new Array(24),
          timestamp: elem.date,
        }
      }

      const { hours } = days[dayId]

      if (!hours[hourId]) {
        hours[hourId] = {
          date,
          nb: 1,
          value,
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
      days: computeMissingDays(sortBy(days, 'timestamp')),
    })
  }

  render() {
    return (
      <table className={styles.table}>
        <tbody>
          <tr>
            <th />
            {times(24, hour => (
              <th key={hour} className='text-xs-center'>
                {hour}
              </th>
            ))}
          </tr>
          {map(this.state.days, (day, key) => (
            <tr key={key}>
              <th>
                <FormattedTime value={day.timestamp} {...DAY_TIME_FORMAT} />
              </th>
              {map(day.hours, (hour, key) => (
                <Tooltip
                  content={
                    hour
                      ? _('weekHeatmapData', {
                          date: hour.date,
                          value: this.props.cellRenderer(hour.value),
                        })
                      : _('weekHeatmapNoData')
                  }
                  key={key}
                >
                  <td className={styles.cell} style={{ background: hour ? hour.color : '#ffffff' }} />
                </Tooltip>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}
