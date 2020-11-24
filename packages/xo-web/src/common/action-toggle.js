import React from 'react'
import PropTypes from 'prop-types'

import ActionButton from './action-button'

const ActionToggle = ({ className, value, ...props }) => (
  <ActionButton {...props} btnStyle={value ? 'success' : null} icon={value ? 'toggle-on' : 'toggle-off'} />
)
ActionToggle.propTypes = {
  value: PropTypes.bool,
}

export { ActionToggle as default }
