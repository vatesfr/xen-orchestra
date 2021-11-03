import React from 'react'
import { CheckboxProps, Checkbox as MuiCheckbox } from '@mui/material'
import { withState } from 'reaclette'

interface ParentState {}

interface State {}

// An interface can only extend an object type or intersection
// of object types with statically known members.
interface Props extends CheckboxProps {}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const Checkbox = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ effects, resetState, state, ...props }) => <MuiCheckbox {...props} />
)

export default Checkbox
