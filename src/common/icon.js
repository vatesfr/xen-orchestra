import classNames from 'classnames'
import isInteger from 'lodash/isInteger'
import React, { PropTypes } from 'react'

const Icon = ({ className, icon, size = 1, fixedWidth }) => (
  <i className={classNames(
      className,
      icon ? `xo-icon-${icon}` : 'fa', // Without icon prop, is a placeholder.
      isInteger(size) ? `fa-${size}x` : `fa-${size}`,
      fixedWidth && 'fa-fw'
  )} />
)
Icon.propTypes = {
  fixedWidth: PropTypes.bool,
  icon: PropTypes.string,
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
}
export default Icon
