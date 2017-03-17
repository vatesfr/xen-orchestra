import React from 'react'

import uncontrollableInput from 'uncontrollable-input'
import Combobox from '../combobox'
import Component from '../base-component'
import propTypes from '../prop-types'

import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@propTypes({
  password: propTypes.bool
})
@uncontrollableInput()
export default class StringInput extends Component {
  render () {
    const { required, schema } = this.props
    const {
      disabled,
      onChange,
      password,
      placeholder = schema.default,
      value,
      ...props
    } = this.props

    return (
      <PrimitiveInputWrapper {...props}>
        <Combobox
          value={value || ''}
          disabled={disabled}
          onChange={onChange}
          options={schema.defaults}
          placeholder={placeholder || schema.default}
          required={required}
          type={password && 'password'}
        />
      </PrimitiveInputWrapper>
    )
  }
}
