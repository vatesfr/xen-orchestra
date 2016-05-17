import React from 'react'
import { SelectSr } from 'select-objects'
import { connectStore } from 'utils'
import { userSrs } from 'selectors'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@connectStore({
  userSrs
}, { withRef: true })
export default class SrInput extends XoAbstractInput {
  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectSr
          disabled={props.disabled}
          multi={props.schema.type === 'array'}
          onChange={props.onChange}
          options={props.userSrs}
          ref='input'
          required={props.required}
          value={props.value}
        />
      </PrimitiveInputWrapper>
    )
  }
}
