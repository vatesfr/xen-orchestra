import _ from 'messages'
import ActionButton from 'action-button'
import React from 'react'

const TabButton = ({
  btnStyle,
  handler,
  icon,
  labelId
}) => (
  <ActionButton
    size='large'
    style={{
      marginBottom: '1em',
      marginLeft: '1em'
    }}
    {...{ btnStyle, handler, icon }}
  >{_(labelId)}</ActionButton>
)
export { TabButton as default }
