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
  info: '#044b7f',
  primary: '#366e98',
  secondary: '#ffffff',
  success: '#198754',
  warning: '#eca649',
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
