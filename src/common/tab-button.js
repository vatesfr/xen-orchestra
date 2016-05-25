import _ from 'messages'
import ActionButton from 'action-button'
import React from 'react'

const COMMON_PROPS = {
  size: 'large',
  style: {
    marginBottom: '1em',
    marginLeft: '1em'
  }
}
const TabButton = ({
  labelId,
  ...props
}) => (
  <ActionButton
    {...props}
    {...COMMON_PROPS}
  ><span className='hidden-md-down'>{_(labelId)}</span></ActionButton>
)
export { TabButton as default }
