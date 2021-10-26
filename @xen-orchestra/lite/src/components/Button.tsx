import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'

import Icon, { IconName } from '../components/Icon'

interface ParentState {}

interface State {}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName
  level?: keyof typeof level
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const level = {
  danger: '#dc3545',
  info: '#17a2b8',
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  warning: '#ffc107',
}

const StyledButton = styled.button<{ level: keyof typeof level }>`
  height: 2em;
  background-color: ${(props) => level[props.level]};
  border: 1px solid #ccc;
  border-radius: 3px;
  width: 100%;
  cursor: pointer;
`

const Button = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ state, effects, level = 'secondary', resetState, icon, children, ...props }) => (
    <StyledButton level={level} {...props}>
      {icon !== undefined && <><Icon icon={icon} /> </>}
      {children}
    </StyledButton>
  )
)

export default Button
