import React from 'react'
import { TextField, TextFieldProps } from '@mui/material'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

// An interface can only extend an object type or intersection
// of object types with statically known members.
interface Props {
  textField?: TextFieldProps
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const TextInput = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ textField }) => (
  <TextField fullWidth {...textField} />
))

export default TextInput
