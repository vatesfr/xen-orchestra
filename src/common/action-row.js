import React from 'react'

import ActionButton from './action-button'

const ActionRow = props => (
  <ActionButton
    {...props}
    size='small'
    style={{
      marginLeft: '0.5em'
    }}
  />
)
export { ActionRow as default }
