import classNames from 'classnames'
import isInteger from 'lodash/isInteger'
import React, { PropTypes } from 'react'

const Icon = ({ icon, size = 1, fixedWidth, ...props }) => {
  props.className = classNames(
    props.className,
    icon !== undefined ? `xo-icon-${icon}` : 'fa', // Without icon prop, is a placeholder.
    isInteger(size) ? `fa-${size}x` : `fa-${size}`,
    fixedWidth && 'fa-fw'
  )

  return <i {...props} />
}
Icon.propTypes = {
  fixedWidth: PropTypes.bool,
  icon: PropTypes.string,
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
}
export default Icon
