import React from 'react'

import AbstractInput from './abstract-input'
import Combobox from '../combobox'
import propTypes from '../prop-types'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@propTypes({
  password: propTypes.bool
})
export default class StringInput extends AbstractInput {
  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <Combobox
          defaultValue={props.defaultValue}
          disabled={props.disabled}
          onChange={props.onChange}
          options={props.schema.defaults || props.defaultValue}
          placeholder={props.placeholder}
          ref='input'
          required={props.required}
          type={props.password && 'password'}
        />
      </PrimitiveInputWrapper>
    )
  }
}
