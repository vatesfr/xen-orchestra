import PropTypes from 'prop-types'
import React from 'react'
import * as d3 from 'd3'
import forEach from 'lodash/forEach'
import map from 'lodash/map'

import Component from '../base-component'
import _ from '../intl'
import { Toggle } from '../form'
import { setStyles } from '../d3-utils'
import { createGetObject, createSelector } from '../selectors'
import { connectStore, propsEqual } from '../utils'

import styles from './index.css'

// ===================================================================

const X_AXIS_STYLE = {
  'shape-rendering': 'crispEdges',
  fill: 'none',
  stroke: '#000',
}

const X_AXIS_TEXT_STYLE = {
  'font-size': '125%',
  fill: 'black',
  stroke: 'transparent',
}

const LABEL_STYLE = {
  'font-size': '125%',
}

const MOUSE_AREA_STYLE = {
  'pointer-events': 'all',
  fill: 'none',
}

const HOVER_LINE_STYLE = {
  'stroke-width': '2px',
  'stroke-dasharray': '5 5',
  stroke: 'red',
  fill: 'none',
}

const HOVER_TEXT_STYLE = {
  fill: 'black',
}

const HORIZON_AREA_N_STEPS = 4
const HORIZON_AREA_MARGIN = 20
const HORIZON_AREA_PATH_STYLE = {
  'fill-opacity': 0.25,
  'stroke-opacity': 0.3,
  fill: 'darkgreen',
  stroke: 'transparent',
}

// ===================================================================

@connectStore(() => {
  const label = createSelector(
    createGetObject((_, props) => props.objectId),
    object => object.name_label
  )

  return { label }
})
class XoWeekChart extends Component {
  static propTypes = {
    chartHeight: PropTypes.number,
    chartWidth: PropTypes.number,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.number.isRequired,
        value: PropTypes.number.isRequired,
      })
    ).isRequired,
    maxValue: PropTypes.number,
    objectId: PropTypes.string.isRequired,
    onTooltipChange: PropTypes.func.isRequired,
    tooltipX: PropTypes.number.isRequired,
    valueRenderer: PropTypes.func,
  }

  static defaultProps = {
    chartHeight: 70,
    chartWidth: 300,
    valueRenderer: value => value,
  }

  _x = d3.scaleTime()
  _y = d3.scaleLinear()

  _bisectDate = d3.bisector(elem => elem.date).left

  _xAxis = d3.axisBottom().scale(this._x)

  _line = d3
    .line()
    .x(elem => this._x(elem.date))
    .y(elem => this._y(elem.value))

  _drawHorizonArea(data, max = d3.max(data, elem => elem.value)) {
    const intervalSize = max / HORIZON_AREA_N_STEPS
    const splittedData = []

    // Start.
    let date = new Date(data[0].date)
    for (let i = 0; i < HORIZON_AREA_N_STEPS; i++) {
      splittedData[i] = [
        {
          date,
          value: 0,
        },
      ]
    }

    // Middle.
    forEach(data, elem => {
      const date = new Date(elem.date)
      for (let i = 0; i < HORIZON_AREA_N_STEPS; i++) {
        splittedData[i].push({
          date,
          value: Math.min(Math.max(0, elem.value - intervalSize * i), intervalSize),
        })
      }
    })

    // End.
    date = new Date(data[data.length - 1].date)
    for (let i = 0; i < HORIZON_AREA_N_STEPS; i++) {
      splittedData[i].push({
        date,
        value: 0,
      })
    }

    this._x.domain(d3.extent(splittedData[0], elem => elem.date))
    this._y.domain([0, max / HORIZON_AREA_N_STEPS])

    const svg = this._svg

    svg.select('.horizon-area').selectAll('path').remove()
    forEach(splittedData, data => {
      svg.select('.horizon-area').append('path').datum(data).attr('d', this._line)::setStyles(HORIZON_AREA_PATH_STYLE)
    })
  }

  _draw(props = this.props) {
    const svg = this._svg

    // 1. Update dimensions.
    const width = props.chartWidth
    const horizonAreaWidth = width - HORIZON_AREA_MARGIN * 2

    const horizonAreaHeight = props.chartHeight
    const height = horizonAreaHeight + HORIZON_AREA_MARGIN

    this._x.range([0, horizonAreaWidth])
    this._y.range([horizonAreaHeight, 0])

    svg
      .attr('width', width)
      .attr('height', height)
      .select('.mouse-area')
      .attr('width', horizonAreaWidth)
      .attr('height', horizonAreaHeight)

    svg.select('.hover-container').select('.hover-line').attr('y2', horizonAreaHeight)

    // 2. Draw horizon area.
    this._drawHorizonArea(props.data, props.maxValue)

    // 3. Update x axis.
    svg
      .select('.x-axis')
      .call(this._xAxis)
      .attr('transform', `translate(0, ${props.chartHeight})`)
      .selectAll('text')
      ::setStyles(X_AXIS_TEXT_STYLE)

    // 4. Update label.
    svg.select('.label').attr('dx', 5).attr('dy', 20).text(props.label)
  }

  _handleMouseMove = () => {
    this.props.onTooltipChange(d3.mouse(this.refs.chart)[0] - HORIZON_AREA_MARGIN)
  }

  // Update hover area position and text.
  _updateTooltip(tooltipX) {
    const date = this._x.invert(tooltipX)
    const { data } = this.props
    const index = this._bisectDate(data, date, 1)

    const d0 = data[index - 1]
    const d1 = data[index]

    // Outside limits.
    if (d1 === undefined) {
      return
    }

    const elem = date - d0.date > d1.date - date ? d1 : d0
    const x = this._x(elem.date)

    const { props } = this
    const hover = this._svg.select('.hover-container')

    hover.select('.hover-line').attr('x1', x).attr('x2', x)

    hover
      .select('.hover-text')
      .attr('dx', x + 5)
      .attr('dy', props.chartHeight / 2)
      .text(props.valueRenderer(elem.value))
  }

  componentDidMount() {
    // Horizon area ----------------------------------------

    const svg = (this._svg = d3
      .select(this.refs.chart)
      .append('svg')
      .attr('transform', `translate(${HORIZON_AREA_MARGIN}, 0)`))
    svg.append('g').attr('class', 'x-axis')::setStyles(X_AXIS_STYLE)

    svg.append('g').attr('class', 'horizon-area')
    svg.append('text').attr('class', 'label')::setStyles(LABEL_STYLE)

    // Tooltip ---------------------------------------------
    svg.append('rect').attr('class', 'mouse-area').on('mousemove', this._handleMouseMove)::setStyles(MOUSE_AREA_STYLE)

    const hover = svg.append('g').attr('class', 'hover-container')::setStyles('pointer-events', 'none')
    hover.append('line').attr('class', 'hover-line').attr('y1', 0)::setStyles(HOVER_LINE_STYLE)
    hover.append('text').attr('class', 'hover-text')::setStyles(HOVER_TEXT_STYLE)

    this._draw()
  }

  componentWillReceiveProps(nextProps) {
    const { props } = this

    if (!propsEqual(props, nextProps, ['chartHeight', 'chartWidth', 'data', 'maxValue'])) {
      this._draw(nextProps)
    }

    if (props.tooltipX !== nextProps.tooltipX) {
      this._updateTooltip(nextProps.tooltipX)
    }
  }

  render() {
    return <div ref='chart' />
  }
}

// ===================================================================

export default class XoWeekCharts extends Component {
  static propTypes = {
    chartHeight: PropTypes.number,
    series: PropTypes.arrayOf(
      PropTypes.shape({
        data: PropTypes.arrayOf(
          PropTypes.shape({
            date: PropTypes.number.isRequired,
            value: PropTypes.number.isRequired,
          })
        ).isRequired,
        objectId: PropTypes.string.isRequired,
      })
    ).isRequired,
    valueRenderer: PropTypes.func,
  }

  _handleResize = () => {
    const { container } = this.refs
    this.setState({
      chartsWidth: container && container.offsetWidth,
    })
  }

  _handleTooltipChange = x => {
    this.setState({ tooltipX: x })
  }

  _updateScale = (useScale, series = this.props.series) => {
    let max

    if (useScale) {
      max = 0
      forEach(series, series => {
        forEach(series.data, elem => {
          max = Math.max(elem.value, max)
        })
      })
    }

    this.setState({
      maxValue: max,
    })
  }

  componentDidMount() {
    window.addEventListener('resize', this._handleResize)
    this._handleResize()
  }

  componentWillMount() {
    this.setState({
      tooltipX: 0,
    })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._handleResize)
  }

  componentWillReceiveProps(nextProps) {
    const { series } = nextProps

    if (this.props.series !== series) {
      this.setState({ tooltipX: 0 })
      this._updateScale(this.state.maxValue !== undefined, series)
    }
  }

  render() {
    const {
      props,
      state: { chartsWidth, maxValue, tooltipX },
    } = this

    return (
      <div>
        <div>
          <p className='mt-1'>
            {_('weeklyChartsScaleInfo')} <Toggle iconSize={1} icon='scale' onChange={this._updateScale} />
          </p>
        </div>
        <div ref='container' className={styles.container}>
          {chartsWidth &&
            map(props.series, (series, key) => (
              <XoWeekChart
                {...series}
                chartWidth={chartsWidth}
                key={key}
                maxValue={maxValue}
                onTooltipChange={this._handleTooltipChange}
                tooltipX={tooltipX}
                valueRenderer={props.valueRenderer}
              />
            ))}
        </div>
      </div>
    )
  }
}
