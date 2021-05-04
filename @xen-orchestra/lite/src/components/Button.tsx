import React from 'react'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

interface Props {
  children?: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const Button = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ children, onClick }) => (
  <button onClick={onClick}>{children}</button>
))

export default Button
