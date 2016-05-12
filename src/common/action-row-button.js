import React from 'react'

import ActionButton from './action-button'

const ActionRowButton = props => (
  <ActionButton
    {...props}
    size='small'
    style={{
      marginLeft: '0.5em'
    }}
  />
)
export { ActionRowButton as default }
