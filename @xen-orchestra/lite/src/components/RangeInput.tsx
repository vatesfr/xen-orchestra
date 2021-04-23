import React from 'react'

type Props = Omit<React.ComponentPropsWithoutRef<'input'>, 'type'>

const RangeInput = React.memo((props: Props) => <input {...props} type='range' />)

export default RangeInput
