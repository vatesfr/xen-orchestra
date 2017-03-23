import React from 'react'
import styled from 'styled-components'

import ActionButton from './action-button'
import propTypes from './prop-types'

const Button = styled(ActionButton)`
  background-color: ${p => p.theme[`${p.state ? 'enabled' : 'disabled'}StateBg`]}
  border: 2px solid ${p => p.theme[`${p.state ? 'enabled' : 'disabled'}StateColor`]}
  color: ${p => p.theme[`${p.state ? 'enabled' : 'disabled'}StateColor`]}
`

const StateButton = ({
  disabledHandler,
  disabledLabel,
  disabledTooltip,

  enabledLabel,
  enabledTooltip,
  enabledHandler,

  state,
  ...props
}) =>
  <Button
    handler={state ? enabledHandler : disabledHandler}
    tooltip={state ? enabledTooltip : disabledTooltip}
    {...props}
    icon={state ? 'running' : 'halted'}
    size='small'
    state={state}
  >
    {state ? enabledLabel : disabledLabel}
  </Button>

export default propTypes({
  state: propTypes.bool.isRequired
})(StateButton)
