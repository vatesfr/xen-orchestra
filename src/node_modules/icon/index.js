import classNames from 'classnames'
import isInteger from 'lodash/isInteger'
import React, { PropTypes } from 'react'

const Icon = ({ icon, size = 1, fixedWidth, ...props }) => (
  <i className={classNames(
      `xo-icon-${icon}`,
      isInteger(size) ? `fa-${size}x` : `fa-${size}`,
      fixedWidth && 'fa-fw'
  )} {...props} />
)
Icon.propTypes = {
  fixedWidth: PropTypes.bool,
  icon: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
}
export default Icon
