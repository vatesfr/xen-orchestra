import classNames from 'classnames'
import isInteger from 'lodash/isInteger'
import PropTypes from 'prop-types'
import React from 'react'

const Icon = ({ icon, size = 1, color, fixedWidth, ...props }) => {
  props.className = classNames(
    props.className,
    icon !== undefined ? `xo-icon-${icon}` : 'fa', // Without icon prop, is a placeholder.
    isInteger(size) ? `fa-${size}x` : `fa-${size}`,
    color,
    fixedWidth && 'fa-fw'
  )

  return <i {...props} />
}

Icon.propTypes = {
  color: PropTypes.string,
  fixedWidth: PropTypes.bool,
  icon: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export { Icon as default }

export const StackedIcons = ({ icons, ...props }) => (
  <span className={`fa-stack ${props.className}`}>
    {icons.map(({ icon, size, ...iconProps }) => (
      <Icon
        {...iconProps}
        {...props}
        key={icon}
        icon={icon}
        size={`stack-${size}x`}
      />
    ))}
  </span>
)

StackedIcons.propTypes = {
  icons: PropTypes.array.isRequired,
}
