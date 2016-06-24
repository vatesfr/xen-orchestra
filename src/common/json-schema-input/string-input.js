import React from 'react'

import AbstractInput from './abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

export default class StringInput extends AbstractInput {
  render () {
    const { props } = this
    const { onChange } = props

    return (
      <PrimitiveInputWrapper {...props}>
        <input
          className='form-control'
          defaultValue={props.defaultValue || ''}
          disabled={props.disabled}
          onChange={onChange && (event => onChange(event.target.value))}
          placeholder={props.placeholder}
          ref='input'
          required={props.required}
          type={props.schema['xo:type'] === 'password' ? 'password' : 'text'}
        />
      </PrimitiveInputWrapper>
    )
  }
}
