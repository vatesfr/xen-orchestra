import React from 'react'
import { TextField, TextFieldProps } from '@mui/material'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

// An interface can only extend an object type or intersection
// of object types with statically known members.
type Props = _Props & TextFieldProps

interface _Props {}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const Input = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ effects, resetState, state, ...props }) => <TextField fullWidth {...props} />
)

export default Input
