import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import { isInteger, map } from 'lodash'

import styles from './index.css'

const ICON_WIDTH = 38.56 // fa-2x (2em) ; font-size 15px

const disk = (x, y, loss) => (
  <foreignObject x={x - ICON_WIDTH / 2} y={y} width={ICON_WIDTH} height={ICON_WIDTH}>
    <Icon className={loss && styles.loss} size={2} icon='disk' fixedWidth />
  </foreignObject>
)

const xosan = (x, y, h) => (
  <foreignObject x={x - ICON_WIDTH / 2} y={y} width={ICON_WIDTH} height={ICON_WIDTH}>
    <Icon icon='sr' size={2} fixedWidth />
  </foreignObject>
)

const stroke = (x1, y1, x2, y2, xo = 0, yo = 0) => (
  <path
    d={`M${x1} ${y1} L${x2} ${y2}`}
    key={`${x1},${y1},${x2},${y2},${xo},${yo}`}
    stroke='#373a3c'
    strokeLinecap='round'
    strokeWidth='4'
    transform={`translate(${xo} ${yo})`}
  />
)

const fork = (n, x, y, w, h, nDisksLoss) => [
  // horizontal line
  stroke(w / (2 * n), 0, w - w / (2 * n), 0, x, y),
  // vertical lines (and disks icons)
  map(new Array(n), (_, i) => [
    stroke((i * w) / n + w / (2 * n), 0, (i * w) / n + w / (2 * n), h, x, y),
    nDisksLoss !== undefined && disk(x + (i * w) / n + w / (2 * n), y + h, i >= n - nDisksLoss),
  ]),
]

const graph = (nGroups, nPerGroup, w, h, disksLoss) => {
  const hUnit = h / 5

  return (
    <svg width={w} height={h}>
      {xosan(w / 2, 0)}
      {stroke(w / 2, hUnit, w / 2, 2 * hUnit)}
      {nGroups === 1
        ? fork(nPerGroup, 0, 2 * hUnit, w, hUnit, disksLoss)
        : [
            fork(nGroups, 0, 2 * hUnit, w, hUnit),
            map(new Array(nGroups), (_, i) =>
              fork(nPerGroup, (i * w) / nGroups, 3 * hUnit, w / nGroups, hUnit, disksLoss)
            ),
          ]}
    </svg>
  )
}

const disperseGraph = (nSrs, redundancy, w, h) => {
  return graph(1, nSrs, w, h, redundancy)
}

const replicationGraph = (nSrs, redundancy, w, h) => {
  const nGroups = nSrs / redundancy

  if (!isInteger(nGroups)) {
    return null
  }

  return graph(nGroups, redundancy, w, h, redundancy - 1)
}

export default class Graph extends Component {
  static propTypes = {
    layout: PropTypes.string.isRequired,
    redundancy: PropTypes.number.isRequired,
    nSrs: PropTypes.number,
  }

  render() {
    const { layout, redundancy, nSrs, width, height } = this.props

    return (
      <div className={styles.wrapper}>
        <div className={styles.graphWrapper}>
          <div className={styles.graph}>
            {layout === 'disperse'
              ? disperseGraph(nSrs, redundancy, width, height)
              : replicationGraph(nSrs, redundancy - (layout === 'replica_arbiter' ? 1 : 0), width, height)}
          </div>
        </div>
        <div>
          <strong className={styles.legend}>{_('xosanDiskLossLegend')}</strong>
        </div>
      </div>
    )
  }
}
