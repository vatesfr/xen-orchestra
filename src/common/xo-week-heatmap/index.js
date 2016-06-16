import React from 'react'
import _ from 'messages'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
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
    this._updateState(nextProps)
  }

  componentWillMount () {
    this._updateState()
  }

  _computeColorGen = data => scaleSequential(interpolateViridis)
    .domain(extent(data, value => value.value).reverse())

  _updateState (props = this.props) {
    const {
      data,
      intl: {
        formatTime
      }
    } = props
    const colorGen = this._computeColorGen(props.data)
    const matrix = {}

    forEach(data, elem => {
      const date = new Date(elem.date)
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

      cell.color = colorGen(cell.value / cell.nb)
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
          {map(this.state.matrix, (hours, day) => (
            <tr key={day}>
              <th>{day}</th>
              {map(hours, (hour, key) => (
                <Tooltip
                  className={styles.cell}
                  key={key}
                  style={{ backgroundColor: hour.color }}
                  tagName='td'
                  content={hour.value != null
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
