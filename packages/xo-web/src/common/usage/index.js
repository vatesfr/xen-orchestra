import _ from 'intl'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'
import sum from 'lodash/sum'
import { formatSize } from 'utils'

import Tooltip from '../tooltip'

const Usage = ({ total, children, type, tooltipOthers }) => {
  const limit = total / 400
  let nOthers = 0
  const othersValues = React.Children.map(children, child => {
    const { value, n } = child.props
    if (value < limit) {
      nOthers += n === undefined ? 1 : n
      return value
    }
    return 0
  })
  const othersTotal = sum(othersValues)
  return (
    <span className='usage'>
      {React.Children.map(
        children,
        (child, index) =>
          child.props.value > limit && cloneElement(child, { total })
      )}
      <Element
        others={!tooltipOthers}
        tooltip={
          tooltipOthers && type !== undefined && nOthers > 0
            ? _('tooltipOthers', {
                nOthers,
                size: formatSize(othersTotal),
                type,
              })
            : _('others')
        }
        total={total}
        value={othersTotal}
      />
    </span>
  )
}
Usage.propTypes = {
  tooltipOthers: PropTypes.bool,
  total: PropTypes.number.isRequired,
  type: PropTypes.string,
}
export { Usage as default }

const Element = ({ highlight, href, others, tooltip, total, value }) => (
  <Tooltip content={tooltip}>
    <a
      href={href}
      className={classNames(
        'usage-element',
        highlight && 'usage-element-highlight',
        others && 'usage-element-others'
      )}
      style={{ width: (value / total) * 100 + '%' }}
    />
  </Tooltip>
)
Element.propTypes = {
  highlight: PropTypes.bool,
  href: PropTypes.string,
  others: PropTypes.bool,
  tooltip: PropTypes.node,
  value: PropTypes.number.isRequired,
}
export { Element as UsageElement }

export const Limits = ({ used, toBeUsed, limit }) => {
  const available = limit - used

  return (
    <span className='limits'>
      <span
        className='limits-used'
        style={{ width: ((used || 0) / limit) * 100 + '%' }}
      />
      <span
        className={
          toBeUsed > available ? 'limits-over-used' : 'limits-to-be-used'
        }
        style={{
          width: (Math.min(toBeUsed || 0, available) / limit) * 100 + '%',
        }}
      />
    </span>
  )
}
Limits.propTypes = {
  used: PropTypes.number,
  toBeUsed: PropTypes.number,
  limit: PropTypes.number.isRequired,
}
