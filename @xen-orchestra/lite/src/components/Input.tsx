import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const StyledInput = styled.input`
  height: ${props => props.type === 'checkbox' ? 'unset' : '2em'};
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 3px;
  width: ${props => props.type === 'checkbox' ? 'unset' : '100%'};
`

const Input = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ state, effects, resetState, ...props }) => <StyledInput {...props} />
)

export default Input
