import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'

import Icon, { IconName } from '../components/Icon'

interface ParentState {}

interface State {}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const StyledButton = styled.button`
  height: 2em;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 3px;
  width: 100%;
  cursor: pointer;
`

const Button = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ state, effects, resetState, icon, children, ...props }) => (
    <StyledButton {...props}>
      {icon !== undefined && <><Icon icon={icon} /> </>}
      {children}
    </StyledButton>
  )
)

export default Button
