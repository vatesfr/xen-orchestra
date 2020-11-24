import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'

import decorate from '../apply-decorators'

// it provide `data-*` to add params to the `onChange`
const Number_ = decorate([
  provideState({
    initialState: () => ({
      displayedValue: '',
    }),
    effects: {
      onChange(_, { target: { value } }) {
        const { state, props } = this
        state.displayedValue = value = value.trim()

        if (value === '') {
          value = undefined
        } else {
          value = +value
          if (Number.isNaN(value)) {
            return
          }
        }

        const params = {}
        let empty = true
        Object.keys(props).forEach(key => {
          if (key.startsWith('data-')) {
            empty = false
            params[key.slice(5)] = props[key]
          }
        })

        props.onChange(value, empty ? undefined : params)
      },
    },
    computed: {
      value: ({ displayedValue }, { value }) => {
        const numericValue = +displayedValue
        if (displayedValue === '' || (!Number.isNaN(numericValue) && numericValue !== value)) {
          return value === undefined ? '' : String(value)
        }
        return displayedValue
      },
    },
  }),
  injectState,
  ({ state, effects, value, className = 'form-control', ...props }) => (
    <input {...props} className={className} onChange={effects.onChange} type='number' value={state.value} />
  ),
])

Number_.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number,
}

export default Number_
