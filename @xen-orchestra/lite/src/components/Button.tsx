import React from 'react'
import { Button as MuiButton, ButtonProps, Theme } from '@mui/material'
import { SxProps } from '@mui/system'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

interface Props extends ButtonProps {}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const MUI_CSS_BUTTON: SxProps<Theme> = {
  width: '100%',
}

const Button = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ children, color = 'secondary', effects, resetState, state, variant = 'contained', ...props }) => (
    <MuiButton color={color} sx={MUI_CSS_BUTTON} variant={variant} {...props}>
      {children}
    </MuiButton>
  )
)

export default Button
