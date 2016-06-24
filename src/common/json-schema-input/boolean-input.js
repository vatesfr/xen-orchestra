import React from 'react'
import { Toggle } from 'form'

import AbstractInput from './abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

export default class BooleanInput extends AbstractInput {

  get value () {
    return this.refs.input.value
  }

  set value (value) {
    this.refs.input.value = value
  }

  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <div className='checkbox form-control'>
          <Toggle
            defaultValue={props.defaultValue || props.schema.default}
            disabled={props.disabled}
            onChange={props.onChange}
            ref='input'
          />
        </div>
      </PrimitiveInputWrapper>
    )
  }
}
