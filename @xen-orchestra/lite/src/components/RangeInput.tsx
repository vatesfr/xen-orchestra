import React from 'react'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

interface Props extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {
  max: number
  min: number
  onChange: React.ChangeEventHandler<HTMLInputElement>
  step: number
  value: number
}

const RangeInput: React.FC<Props> = React.memo(props => <input {...props} type='range' />)

export default RangeInput
