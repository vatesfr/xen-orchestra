import React from 'react'
import { SelectSubject } from 'select-objects'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from '../json-schema-input/helpers'

// ===================================================================

export default class SubjectInput extends XoAbstractInput {
  render() {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectSubject
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
