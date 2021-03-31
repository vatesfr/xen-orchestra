import React from 'react'
import { withState } from 'reaclette'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

interface Props extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {}

const RangeInput: React.FC<Props> = React.memo(props => <input {...props} type='range' />)

export default RangeInput
