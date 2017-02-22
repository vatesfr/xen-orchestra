import _ from 'intl'
import classNames from 'classnames'
import Component from 'base-component'
import Icon from 'icon'
import propTypes from 'prop-types'
import React from 'react'
import {
  floor
} from 'lodash'

import styles from './index.css'

const DISK = <Icon className={styles.item} icon='disk' fixedWidth />
const DISK_LOSS = <Icon className={classNames(styles.item, styles.loss)} icon='disk' fixedWidth />
const XOSAN = <Icon className={styles.item} icon='sr' fixedWidth />

const BLANK = <span className={styles.box}>&nbsp;</span>
const HORIZONTAL = <span className={styles.box}>&#9473;</span>
const HORIZONTAL_UP = <span className={styles.box}>&#9531;</span>
const HORIZONTAL_DOWN = <span className={styles.box}>&#9523;</span>
const TOP_LEFT = <span className={styles.box}>&#9487;</span>
const TOP_RIGHT = <span className={styles.box}>&#9491;</span>
const PLUS = <span className={styles.box}>&#9547;</span>

const RIGHT = [ BLANK, TOP_LEFT, HORIZONTAL ]
const LEFT = [ HORIZONTAL, TOP_RIGHT, BLANK ]
const DOWN = [ HORIZONTAL, HORIZONTAL_DOWN, HORIZONTAL ]
const UP = [ HORIZONTAL, HORIZONTAL_UP, HORIZONTAL ]
const UP_DOWN = [ HORIZONTAL, PLUS, HORIZONTAL ]
const OFFSET = [ HORIZONTAL, HORIZONTAL, HORIZONTAL ]
const EMPTY = [ BLANK, BLANK, BLANK ]

const _fill = (n, content) => new Array(n).fill(content)

const _fork = (n, space) => {
  const offset = _fill(space || 0, OFFSET)
  const halfOffset = _fill(floor((space || 0) / 2), OFFSET)

  const upWithOffset = [ halfOffset, UP, halfOffset ]
  const upAndDownWithOffset = [ offset, UP_DOWN, offset ]

  if (n === 2) {
    return [ RIGHT, upWithOffset, LEFT ]
  }

  const odd = n % 2 === 1
  const nSide = floor((n - 2) / 2)

  const leftHalf = [ RIGHT, _fill(nSide, [ offset, DOWN ]) ]
  const rightHalf = [ _fill(nSide, [ DOWN, offset ]), LEFT ]

  if (odd) {
    return [ leftHalf, upAndDownWithOffset, rightHalf ]
  } else {
    return [ leftHalf, upWithOffset, rightHalf ]
  }
}

const _blank = n => _fill(n, EMPTY)
const _diskGroup = (n, loss) => n % 2
  ? [ _fill(n - loss, DISK), _fill(loss, DISK_LOSS) ]
  : [
    _fill(n / 2 - Math.max(0, loss - n / 2), DISK),
    _fill(Math.max(0, loss - n / 2), DISK_LOSS),
    EMPTY,
    _fill(n / 2 - Math.min(n / 2, loss), DISK),
    _fill(Math.min(n / 2, loss), DISK_LOSS)
  ]

const _replicationGraph = (nGroups, nPerGroup) => {
  const suppXosanOffset = nPerGroup % 2 ? 0 : floor(nGroups / 2)
  const suppForkOffset = 1 - nPerGroup % 2

  return <div className={styles.graph}>
    {_blank(floor(((nPerGroup * nGroups) + nGroups - 1) / 2) + suppXosanOffset)}
    {XOSAN}
    <br />

    {_blank(floor(nPerGroup / 2))}
    {_fork(nGroups, (nPerGroup - 1) + 1 + suppForkOffset)}
    <br />

    {_fill(nGroups, [ _fork(nPerGroup), _blank(1) ])}
    <br />

    {_fill(nGroups, [ _diskGroup(nPerGroup, nPerGroup - 1), _blank(1) ])}
  </div>
}

const _disperseGraph = (nSrs, redundancy) => {
  return <div className={styles.graph}>
    {_blank(floor(nSrs / 2))}
    {XOSAN}
    <br />

    {_fork(nSrs)}
    <br />

    {_diskGroup(nSrs, redundancy)}
  </div>
}

@propTypes({
  layout: propTypes.string.isRequired,
  redundancy: propTypes.number.isRequired,
  nSrs: propTypes.number
})
export default class Graph extends Component {
  render () {
    const { layout, redundancy, nSrs } = this.props

    return <div className={styles.wrapper}>
      <div className={styles.graphWrapper}>
        {layout === 'disperse'
         ? _disperseGraph(nSrs, redundancy)
         : _replicationGraph(nSrs, redundancy)}
      </div>
      <div>
        <strong className={styles.legend}>{_('xosanDiskLossLegend')}</strong>
      </div>
    </div>
  }
}
