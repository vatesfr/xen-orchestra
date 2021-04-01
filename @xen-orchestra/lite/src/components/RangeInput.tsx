import React from 'react'
import { withState } from 'reaclette'

interface ParentState {}

interface State {
  currentValue: number
  input: React.RefObject<HTMLInputElement>
}

interface Props {
  defaultValue: number
  max: number
  min: number
  onChange: (value: number) => void
  step: number
}

interface ParentEffects {}

interface Effects {
  _onChange: React.ChangeEventHandler<HTMLInputElement>
}

interface Computed {}

const RangeInput = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: props => ({
      currentValue: props.defaultValue,
      input: React.createRef(),
    }),
    effects: {
      _onChange: function (e) {
        const { value } = e.currentTarget

        this.state.currentValue = +value
        this.props.onChange(+value)
      },
    },
  },
  ({ effects, max, min, state, step }) => (
    <input
      max={max}
      min={min}
      onChange={effects._onChange}
      ref={state.input}
      step={step}
      type='range'
      value={state.currentValue}
    />
  )
)

export default RangeInput
