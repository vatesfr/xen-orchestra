import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import ActionButton from './action-button'
import themes from './themes'
import propTypes from './prop-types'

const Button = styled(ActionButton)`
  background-color: ${props => props.theme.bgColor}
  border: 2px solid ${props => props.theme.color}
  color: ${props => props.theme.color}
`
const enabledTheme = {
  color: themes.base.enabledStateColor,
  bgColor: themes.base.enabledStateBg
}

const disabledTheme = {
  color: themes.base.disabledStateColor,
  bgColor: themes.base.disabledStateBg
}

const StateButton = ({value, state, ...props}) =>
  <ThemeProvider theme={value ? enabledTheme : disabledTheme}>
    <Button
      {...props}
      icon={value ? 'running' : 'halted'}
      size='small'
    >
      { state }
    </Button>
  </ThemeProvider>

export default propTypes({
  value: propTypes.bool
})(StateButton)
