import classNames from 'classnames'
import isInteger from 'lodash/isInteger'
import React from 'react'

import propTypes from './prop-types'

const Icon = ({ icon, size = 1, fixedWidth, ...props }) => {
  props.className = classNames(
    props.className,
    icon !== undefined ? `xo-icon-${icon}` : 'fa', // Without icon prop, is a placeholder.
    isInteger(size) ? `fa-${size}x` : `fa-${size}`,
    fixedWidth && 'fa-fw'
  )

  return <i {...props} />
}
propTypes(Icon)({
  fixedWidth: propTypes.bool,
  icon: propTypes.string,
  size: propTypes.oneOfType([
    propTypes.string,
    propTypes.number
  ])
})
export default Icon
