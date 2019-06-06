import _ from 'intl'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'
import { formatSize } from 'utils'

import Tooltip from '../tooltip'

const Usage = ({ total, children, type }) => {
  const limit = total / 400
  let nOthers = 0
  let othersTotal = 0
  React.Children.forEach(children, child => {
    const { value, n = 1 } = child.props
    if (value < limit) {
      nOthers += n
      othersTotal += value
    }
  })

  return (
    <span className='usage'>
      {React.Children.map(
        children,
        (child, index) =>
          child.props.value > limit && cloneElement(child, { total })
      )}
      <Element
        others={type === undefined}
        tooltip={
          type !== undefined && nOthers > 0
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
