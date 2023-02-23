import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import omit from 'lodash/omit.js'

import ActionButton from './action-button'

// do not forward `state` to ActionButton
const Button = styled(p => <ActionButton {...omit(p, 'state')} />)`
  background-color: ${p => p.theme[`${p.state ? 'enabled' : 'disabled'}StateBg`]};
  border: 2px solid ${p => p.theme[`${p.state ? 'enabled' : 'disabled'}StateColor`]};
  color: ${p => p.theme[`${p.state ? 'enabled' : 'disabled'}StateColor`]};
`

const StateButton = ({
  disabledHandler,
  disabledHandlerParam,
  disabledLabel,
  disabledTooltip,

  enabledLabel,
  enabledTooltip,
  enabledHandler,
  enabledHandlerParam,

  state,
  ...props
}) => (
  <Button
    handler={state ? enabledHandler : disabledHandler}
    handlerParam={state ? enabledHandlerParam : disabledHandlerParam}
    tooltip={state ? enabledTooltip : disabledTooltip}
    {...props}
    icon={state ? 'running' : 'halted'}
    size='small'
    state={state}
  >
    {state ? enabledLabel : disabledLabel}
  </Button>
)

StateButton.propTypes = {
  state: PropTypes.bool.isRequired,
}

export { StateButton as default }
