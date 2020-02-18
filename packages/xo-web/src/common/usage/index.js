import _ from 'intl'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'
import { compact, sumBy } from 'lodash'

import Tooltip from '../tooltip'

const Usage = ({ total, children, url }) => {
  const limit = total / 400
  const othersProps = compact(
    React.Children.map(children, child => {
      const { value } = child.props
      return value < limit && child.props
    })
  )
  const othersTotal = sumBy(othersProps, 'value')
  const nOthers = othersProps.length
  return (
    <span className='usage'>
      {nOthers > 1 ? (
        <span>
          {React.Children.map(
            children,
            (child, index) =>
              child.props.value > limit &&
              cloneElement(child, {
                href: typeof url === 'function' ? url(child.props) : url,
                total,
              })
          )}
          <Element
            href={typeof url === 'function' ? url(othersProps) : url}
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
  url: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
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
