import React from 'react'
import { Button as MuiButton, ButtonProps } from '@mui/material'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

interface Props extends ButtonProps {}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const Button = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ children, color = 'secondary', effects, resetState, state, variant = 'contained', ...props }) => (
    <MuiButton color={color} fullWidth variant={variant} {...props}>
      {children}
    </MuiButton>
  )
)

export default Button
