import React from 'react'
import { withState } from 'reaclette'

interface ParentState {}

interface State {
  input: React.RefObject<HTMLInputElement>
}

interface Props extends React.AllHTMLAttributes<HTMLInputElement> {
  max: number
  min: number
  onChange: React.ChangeEventHandler<HTMLInputElement>
  step: number
  value: number
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const RangeInput = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      input: React.createRef(),
    }),
  },
  ({ effects, resetState, state, ...props }) => <input ref={state.input} type='range' {...props} />
)

export default RangeInput
