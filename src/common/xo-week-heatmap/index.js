import React from 'react'
import _ from 'messages'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import times from 'lodash/times'
import { injectIntl } from 'react-intl'

import Component from '../base-component'
import Tooltip from '../tooltip'
import { propTypes } from '../utils'

import styles from './index.css'

const TIME_FORMAT = {
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  month: 'short',
  second: 'numeric',
  weekday: 'short',
  year: 'numeric'
}

// ===================================================================

@propTypes({
  cellRenderer: propTypes.func,
  colors: propTypes.arrayOf(
    propTypes.string
  ),
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
    cellRenderer: value => value,
    colors: [
      '#ffffee',
      '#ffffd9',
      '#edf8b1',
      '#c7e9b4',
      '#7fcdbb',
      '#41b6c4',
      '#1d91c0',
      '#225ea8',
      '#253494',
      '#081d58'
    ]
  }

  componentWillReceiveProps = nextProps => this._updateState(nextProps)
  componentWillMount = this._updateState

  _computeIntervals = ({ colors, data }) => {
    const min = minBy(data, 'value').value
    const max = maxBy(data, 'value').value

    const nSteps = max - min
    const nColors = colors.length

    return map(colors, (color, index) => ({
      start: min + index * nSteps / nColors,
      end: min + (1 + index) * nSteps / nColors,
      color
    }))
  }

  _getColor = (intervals, value) => {
    let color = '#ffffff'

    forEach(intervals, (interval, pos) => {
      if (
        interval.start <= value && value < interval.end ||
        (pos === intervals.length - 1 && value === interval.end)
      ) {
        color = interval.color
      }
    })

    return color
  }

  _updateState (props = this.props) {
    const {
      data,
      intl: {
        formatTime
      }
    } = props
    const intervals = this._computeIntervals(props)
    const matrix = {}

    forEach(data, elem => {
      const date = new Date(elem.date * 1000)
      const day = date.getDate()
      const hour = date.getHours()

      const { value } = elem
      let cell

      if (!matrix[day]) {
        matrix[day] = []
      }

      if (!matrix[day][hour]) {
        cell = matrix[day][hour] = {
          value,
          nb: 1,
          date: formatTime(date, TIME_FORMAT)
        }
      } else {
        cell = matrix[day][hour]
        cell.value += value
        cell.nb++
      }

      cell.color = this._getColor(intervals, cell.value / cell.nb)
    })

    // Add missing hours.
    forEach(matrix, day => {
      for (let hour = 0; hour < 24; hour++) {
        if (!day[hour]) {
          day[hour] = {
            nb: 1,
            color: '#ffffff'
          }
        }
      }
    })

    this.setState({ matrix })
  }

  render () {
    return (
      <table className={styles.table}>
        <tbody>
          <tr>
            <th />
            {times(24, hour => <th key={hour} className='text-xs-center'>{hour}</th>)}
          </tr>
          {map(this.state.matrix, (hours, day) => {
            return (
              <tr key={day}>
                <th>{day}</th>
                {map(hours, (hour, key) => (
                  <td key={key} className={styles.cell} style={{ backgroundColor: hour.color }}>
                    <Tooltip
                      content={hour.value != null
                       ? `${this.props.cellRenderer(hour.value / hour.nb)} (${hour.date})`
                       : _('weekHeatmapNoData')}
                    >
                      <div className={styles.cellContent} />
                    </Tooltip>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}
