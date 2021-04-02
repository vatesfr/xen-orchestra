import React from 'react'
import { withState } from 'reaclette'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

interface InputAttributes extends React.AllHTMLAttributes<HTMLInputElement> {
  max: number
  min: number
  step: number
}

interface ParentState {}

interface State {
  currentValue: number
  input: React.RefObject<HTMLInputElement>
}

interface Props {
  defaultValue: number
  inputAttribues: Omit<InputAttributes, 'onChange'>
  onChange: (value: number) => void
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
  ({ effects, inputAttribues, state }) => {
    return (
      <input
        onChange={effects._onChange}
        ref={state.input}
        type='range'
        value={state.currentValue}
        {...inputAttribues}
      />
    )
  }
)

export default RangeInput
