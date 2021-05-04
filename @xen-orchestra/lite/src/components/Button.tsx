import React from 'react'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

interface Props {
  label: string | JSX.Element
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const Button = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
))

export default Button
