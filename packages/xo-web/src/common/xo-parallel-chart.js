import * as d3 from 'd3'
import PropTypes from 'prop-types'
import React from 'react'
import forEach from 'lodash/forEach'
import keys from 'lodash/keys'
import map from 'lodash/map'
import times from 'lodash/times'

import Component from './base-component'
import { setStyles } from './d3-utils'

// ===================================================================

const CHART_WIDTH = 2000
const CHART_HEIGHT = 800

const TICK_SIZE = CHART_WIDTH / 100

const N_TICKS = 4

const TOOLTIP_PADDING = 10

const DEFAULT_STROKE_WIDTH_FACTOR = 500
const HIGHLIGHT_STROKE_WIDTH_FACTOR = 200

const BRUSH_SELECTION_WIDTH = (2 * CHART_WIDTH) / 100

// ===================================================================

const SVG_STYLE = {
  display: 'block',
  height: '100%',
  left: 0,
  position: 'absolute',
  top: 0,
  width: '100%',
}

const SVG_CONTAINER_STYLE = {
  'padding-bottom': '50%',
  'vertical-align': 'middle',
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
}

const SVG_CONTENT = {
  'font-size': `${CHART_WIDTH / 100}px`,
}

const COLUMN_TITLE_STYLE = {
  'font-size': '100%',
  'font-weight': 'bold',
  'text-anchor': 'middle',
}

const COLUMN_VALUES_STYLE = {
  'font-size': '100%',
}

const LINES_CONTAINER_STYLE = {
  'stroke-opacity': 0.5,
  'stroke-width': CHART_WIDTH / DEFAULT_STROKE_WIDTH_FACTOR,
  fill: 'none',
  stroke: 'red',
}

const TOOLTIP_STYLE = {
  fill: 'white',
  'font-size': '125%',
  'font-weight': 'bold',
}

// ===================================================================

export default class XoParallelChart extends Component {
  static propTypes = {
    dataSet: PropTypes.arrayOf(
      PropTypes.shape({
        data: PropTypes.object.isRequired,
        label: PropTypes.string.isRequired,
        objectId: PropTypes.string.isRequired,
      })
    ).isRequired,
    labels: PropTypes.object.isRequired,
    renderers: PropTypes.object,
  }

  _line = d3.line()

  _color = d3.scaleOrdinal(d3.schemeCategory10)

  _handleBrush = () => {
    // 1. Get selected brushes.
    const brushes = []
    this._svg
      .selectAll('.chartColumn')
      .selectAll('.brush')
      .each((_1, _2, [brush]) => {
        if (d3.brushSelection(brush) != null) {
          brushes.push(brush)
        }
      })

    // 2. Change stroke of selected lines.
    const lines = this._svg.select('.linesContainer').selectAll('path')

    lines.each((elem, lineId, lines) => {
      const { data } = elem

      const res = brushes.every(brush => {
        const selection = d3.brushSelection(brush)
        const columnId = brush.__data__
        const { invert } = this._y[columnId] // Range to domain.

        return invert(selection[1]) <= data[columnId] && data[columnId] <= invert(selection[0])
      })

      const line = d3.select(lines[lineId])

      if (!res) {
        line.attr('stroke-opacity', 1.0).attr('stroke', '#e6e6e6')
      } else {
        line.attr('stroke-opacity', 0.5).attr('stroke', this._color(elem.label))
      }
    })
  }

  _brush = d3
    .brushY()
    // Brush area: (x0, y0), (x1, y1)
    .extent([
      [-BRUSH_SELECTION_WIDTH / 2, 0],
      [BRUSH_SELECTION_WIDTH / 2, CHART_HEIGHT],
    ])
    .on('brush', this._handleBrush)
    .on('end', this._handleBrush)

  _highlight(elem, position) {
    const svg = this._svg

    // Reset tooltip.
    svg.selectAll('.objectTooltip').remove()

    // Reset all lines.
    svg.selectAll('.chartLine').attr('stroke-width', CHART_WIDTH / DEFAULT_STROKE_WIDTH_FACTOR)

    if (!position) {
      return
    }

    // Set stroke on selected line.
    svg.select('#chartLine-' + elem.objectId).attr('stroke-width', CHART_WIDTH / HIGHLIGHT_STROKE_WIDTH_FACTOR)

    const { label } = elem

    const tooltip = svg.append('g').attr('class', 'objectTooltip')

    const bbox = tooltip
      .append('text')
      .text(label)
      .attr('x', position[0])
      .attr('y', position[1] - 30)
      ::setStyles(TOOLTIP_STYLE)
      .node()
      .getBBox()

    tooltip
      .insert('rect', '*')
      .attr('x', bbox.x - TOOLTIP_PADDING)
      .attr('y', bbox.y - TOOLTIP_PADDING)
      .attr('width', bbox.width + TOOLTIP_PADDING * 2)
      .attr('height', bbox.height + TOOLTIP_PADDING * 2)
      .style('fill', this._color(label))
  }

  _handleMouseOver = (elem, pathId, paths) => {
    this._highlight(elem, d3.mouse(paths[pathId]))
  }

  _handleMouseOut = elem => {
    this._highlight()
  }

  _draw(props = this.props) {
    const svg = this._svg
    const { labels, dataSet } = props

    const columnsIds = keys(labels)
    const spacing = (CHART_WIDTH - 200) / (columnsIds.length - 1)
    const x = d3
      .scaleOrdinal()
      .domain(columnsIds)
      .range(times(columnsIds.length, n => n * spacing))

    // 1. Remove old nodes.
    svg.selectAll('.chartColumn').remove()

    svg.selectAll('.linesContainer').remove()

    // 2. Build Ys.
    const y = (this._y = {})
    forEach(columnsIds, (columnId, index) => {
      const max = d3.max(dataSet, elem => elem.data[columnId])

      y[columnId] = d3.scaleLinear().domain([0, max]).range([CHART_HEIGHT, 0])
    })

    // 3. Build columns.
    const columns = svg
      .selectAll('.chartColumn')
      .data(columnsIds)
      .enter()
      .append('g')
      .attr('class', 'chartColumn')
      .attr('transform', d => `translate(${x(d)})`)

    // 4. Draw titles.
    columns
      .append('text')
      .text(columnId => labels[columnId])
      .attr('y', -50)
      ::setStyles(COLUMN_TITLE_STYLE)

    // 5. Draw axis.
    columns
      .append('g')
      .each((columnId, axisId, axes) => {
        const axis = d3.axisLeft().ticks(N_TICKS, ',f').tickSize(TICK_SIZE).scale(y[columnId])

        const renderer = props.renderers[columnId]

        // Add optional renderer like formatSize.
        if (renderer) {
          axis.tickFormat(renderer)
        }

        d3.select(axes[axisId]).call(axis)
      })
      ::setStyles(COLUMN_VALUES_STYLE)

    // 6. Draw lines.
    const path = elem => this._line(map(columnsIds.map(columnId => [x(columnId), y[columnId](elem.data[columnId])])))
    svg
      .append('g')
      .attr('class', 'linesContainer')
      ::setStyles(LINES_CONTAINER_STYLE)
      .selectAll('path')
      .data(dataSet)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'chartLine')
      .attr('id', elem => 'chartLine-' + elem.objectId)
      .attr('stroke', elem => this._color(elem.label))
      .attr('shape-rendering', 'optimizeQuality')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .on('mouseover', this._handleMouseOver)
      .on('mouseout', this._handleMouseOut)

    // 7. Brushes.
    columns
      .append('g')
      .attr('class', 'brush')
      .each((_, brushId, brushes) => {
        d3.select(brushes[brushId]).call(this._brush)
      })
  }

  componentDidMount() {
    this._svg = d3
      .select(this.refs.chart)
      .append('div')
      ::setStyles(SVG_CONTAINER_STYLE)
      .append('svg')
      ::setStyles(SVG_STYLE)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)
      .append('g')
      .attr('transform', `translate(${100}, ${100})`)
      ::setStyles(SVG_CONTENT)

    this._draw()
  }

  componentWillReceiveProps(nextProps) {
    this._draw(nextProps)
  }

  render() {
    return <div ref='chart' />
  }
}
