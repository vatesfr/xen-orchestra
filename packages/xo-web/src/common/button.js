import classNames from 'classnames'
import React from 'react'
import PropTypes from 'prop-types'

const Button = ({ active, block, btnStyle = 'secondary', children, outline, size, ...props }) => {
  props.className = classNames(
    props.className,
    'btn',
    `btn${outline ? '-outline' : ''}-${btnStyle}`,
    active === true && 'active',
    block && 'btn-block',
    size === 'large' ? 'btn-lg' : size === 'small' ? 'btn-sm' : null
  )
  if (props.type === undefined && props.form === undefined) {
    props.type = 'button'
  }

  return <button {...props}>{children}</button>
}

Button.propTypes = {
  active: PropTypes.bool,
  block: PropTypes.bool,

  // Bootstrap button style
  //
  // See https://v4-alpha.getbootstrap.com/components/buttons/#examples
  //
  // The default value (secondary) is not listed here because it does
  // not make sense to explicit it.
  btnStyle: PropTypes.oneOf(['danger', 'info', 'link', 'primary', 'success', 'warning']),

  outline: PropTypes.bool,
  size: PropTypes.oneOf(['large', 'small']),
}

export { Button as default }
