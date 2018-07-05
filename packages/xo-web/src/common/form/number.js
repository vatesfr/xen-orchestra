import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from '@julien-f/freactal'

const Number = [
  provideState({
    effects: {
      onChange: (_, { target: { value } }) => (state, props) => {
        if (value === '') {
          if (!props.optional) {
            return
          }

          props.onChange(undefined)
          return
        }
        props.onChange(+value)
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
      value={value === undefined ? undefined : String(value)}
      type='number'
      onChange={effects.onChange}
    />
  ),
].reduceRight((value, decorator) => decorator(value))

Number.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
  optional: PropTypes.bool,
}

export default Number
