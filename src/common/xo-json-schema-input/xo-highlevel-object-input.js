import React from 'react'
import { SelectHighLevelObject } from 'select-objects'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from '../json-schema-input/helpers'

// ===================================================================

export default class HighLevelObjectInput extends XoAbstractInput {
  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectHighLevelObject
          disabled={props.disabled}
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
