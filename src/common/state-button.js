import React from 'react'
import styled from 'styled-components'

import ActionButton from './action-button'
import Colors from './Themes/default.js'
import propTypes from './prop-types'

const Button = styled(ActionButton)`
  background-color: #fff
  border: 2px solid ${props => props.enabled ? Colors.enabled : Colors.disabled}
  color: ${props => props.enabled ? Colors.enabled : Colors.disabled}
  font-size: 12px
  font-weight: bold
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
