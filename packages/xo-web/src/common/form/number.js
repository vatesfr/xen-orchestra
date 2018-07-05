import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from '@julien-f/freactal'

const Number = [
  provideState({
    effects: {
      onChange: (_, { target: { value } }) => (state, props) => {
        props.onChange(value === '' ? undefined : +value)
      },
    },
  }),
  injectState,
  ({
    state,
    effects,
    value,
    className = 'form-control',
    min = 0,
    ...props
  }) => (
    <input
      {...props}
      className={className}
      min={min}
      onChange={effects.onChange}
      type='number'
      value={value === undefined ? '' : String(value)}
    />
  ),
].reduceRight((value, decorator) => decorator(value))

Number.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
}

export default Number
