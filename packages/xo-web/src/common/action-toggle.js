import React from 'react'

import ActionButton from './action-button'
import propTypes from './prop-types-decorator'

const ActionToggle = ({ className, value, ...props }) => (
  <ActionButton
    {...props}
    btnStyle={value ? 'success' : null}
    icon={value ? 'toggle-on' : 'toggle-off'}
  />
)

export default propTypes({
  value: propTypes.bool,
})(ActionToggle)
