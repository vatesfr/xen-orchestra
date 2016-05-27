import ActionButton from 'action-button'
import classnames from 'classnames'
import React from 'react'
import { propTypes } from 'utils'

const ActionToggle = ({ className, value, ...props }) =>
  <ActionButton
    {...props}
    className={classnames(value && 'btn-success', className)}
    icon={value ? 'toggle-on' : 'toggle-off'}
  />

export default propTypes({
  value: propTypes.bool
})(ActionToggle)
