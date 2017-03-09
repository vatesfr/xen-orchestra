import React from 'react'

import autoControlledInput from '../auto-controlled-input'
import Combobox from '../combobox'
import Component from '../base-component'
import getEventValue from '../get-event-value'

import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@autoControlledInput()
export default class NumberInput extends Component {
  _onChange = event => {
    const value = getEventValue(event)
    this.props.onChange(value ? +value : undefined)
  }

  render () {
    const { schema } = this.props
    const {
      disabled,
      onChange,
      required,
      placeholder = schema.default,
      value,
      ...props
    } = this.props

    return (
      <PrimitiveInputWrapper {...props}>
        <Combobox
          value={value === undefined ? '' : String(value)}
          disabled={disabled}
          max={schema.max}
          min={schema.min}
          onChange={this._onChange}
          options={schema.defaults}
          placeholder={placeholder}
          required={required}
          step='any'
          type='number'
        />
      </PrimitiveInputWrapper>
    )
  }
}
