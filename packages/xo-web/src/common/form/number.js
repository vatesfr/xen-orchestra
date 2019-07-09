import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'

import decorate from '../apply-decorators'

// it provide `data-*` to add params to the `onChange`
const Number_ = decorate([
  provideState({
    effects: {
      onChange: (_, { target: { value } }) => (state, props) => {
        value = value.trim()
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
  }),
  injectState,
  ({ state, effects, value, className = 'form-control', ...props }) => (
    <input
      {...props}
      className={className}
      onChange={effects.onChange}
      type='number'
      value={value === undefined ? '' : String(value)}
    />
  ),
])

Number_.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
}

export default Number_
