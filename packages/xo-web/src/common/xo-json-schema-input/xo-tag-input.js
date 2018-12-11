import React from 'react'
import { SelectTag } from 'select-objects'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from '../json-schema-input/helpers'

// ===================================================================

export default class TagInput extends XoAbstractInput {
  render() {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectTag
          disabled={props.disabled}
          hasSelectAll
          multi={props.multi}
          onChange={this._onChange}
          ref='input'
          required={props.required}
          value={props.value}
        />
      </PrimitiveInputWrapper>
    )
  }
}
