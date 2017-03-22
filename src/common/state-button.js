import React from 'react'
import styled from 'styled-components'

import ActionButton from './action-button'
import propTypes from './prop-types'

const Button = styled(ActionButton)`
  background-color: ${p => p.theme[`${p.enabled ? 'enabled' : 'disabled'}StateBg`]}
  border: 2px solid ${p => p.theme[`${p.enabled ? 'enabled' : 'disabled'}StateColor`]}
  color: ${p => p.theme[`${p.enabled ? 'enabled' : 'disabled'}StateColor`]}
`

const StateButton = ({value, state, ...props}) =>
  <Button
    {...props}
    enabled={value}
    icon={value ? 'running' : 'halted'}
    size='small'
  >
    { state }
  </Button>

export default propTypes({
  value: propTypes.bool.isRequired
})(StateButton)
