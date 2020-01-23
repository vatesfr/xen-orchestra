import _ from 'intl'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'
import { compact, sumBy } from 'lodash'

import Tooltip from '../tooltip'

export const getLimit = total => total / 400

const Usage = ({ total, children }) => {
  const limit = getLimit(total)
  const others = compact(
    React.Children.map(children, child => {
      const { value } = child.props
      return value < limit && child.props
    })
  )

  const othersTotal = sumBy(others, 'value')
  const nOthers = others.length

  // last child url
  const othersUrl = others[others.length - 1].href

  return (
    <span className='usage'>
      {nOthers > 1 ? (
        <span>
          {React.Children.map(
            children,
            (child, index) =>
              child.props.value > limit && cloneElement(child, { total })
          )}
          <Element
            href={othersUrl}
            others
            tooltip={_('others', { nOthers })}
            total={total}
            value={othersTotal}
          />
        </span>
      ) : (
        React.Children.map(children, (child, index) =>
          cloneElement(child, { total })
        )
      )}
    </span>
  )
}
Usage.propTypes = {
  total: PropTypes.number.isRequired,
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
