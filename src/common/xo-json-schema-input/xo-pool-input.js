import React from 'react'
import { SelectPool } from 'select-objects'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from '../json-schema-input/helpers'

// ===================================================================

export default class PoolInput extends XoAbstractInput {
  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectPool
          disabled={props.disabled}
          hasSelectAll
          multi={props.multi}
          onChange={props.onChange}
          ref='input'
          required={props.required}
          defaultValue={props.defaultValue}
        />
      </PrimitiveInputWrapper>
    )
  }
}
