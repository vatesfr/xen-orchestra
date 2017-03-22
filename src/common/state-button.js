import React from 'react'
import styled from 'styled-components'

import ActionButton from './action-button'
import themes from './themes'
import propTypes from './prop-types'

const Button = styled(ActionButton)`
  background-color: ${themes.base.statesBackgroundColor}
  border: 2px solid ${props => props.enabled ? themes.base.enabledStateColor : themes.base.disabledStateColor}
  color: ${props => props.enabled ? themes.base.enabledStateColor : themes.base.disabledStateColor}
`

const StateButton = ({value, state, ...props}) =>
  <Button
    {...props}
    enabled={value}
    size='small'
    icon={value ? 'running' : 'halted'}
  >
    { state }
  </Button>

export default propTypes({
  value: propTypes.bool
})(StateButton)
