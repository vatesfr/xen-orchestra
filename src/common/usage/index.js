import _ from 'intl'
import classNames from 'classnames'
import React, { PropTypes, cloneElement } from 'react'
import sum from 'lodash/sum'

import Tooltip from '../tooltip'

const Usage = ({ total, children }) => {
  const limit = total / 400
  const othersValues = React.Children.map(children, child => {
    const { value } = child.props
    return value < limit && value
  })
  const othersTotal = sum(othersValues)
  return <span className='usage'>
    {React.Children.map(children, (child, index) =>
      child.props.value > limit && cloneElement(child, { total })
    )}
    <Element
      others
      tooltip={_('others')}
      total={total}
      value={othersTotal}
    />
  </span>
}
Usage.propTypes = {
  total: PropTypes.number.isRequired
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
  value: PropTypes.number.isRequired
}
export { Element as UsageElement }
