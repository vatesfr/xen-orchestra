import React from 'react'
import { SelectVm } from 'select-objects'
import { connectStore } from 'utils'
import { vms } from 'selectors'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@connectStore({
  vms
}, { withRef: true })
export default class VmInput extends XoAbstractInput {
  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectVm
          disabled={props.disabled}
          multi={props.schema.type === 'array'}
          onChange={props.onChange}
          options={props.vms}
          ref='input'
          required={props.required}
        />
      </PrimitiveInputWrapper>
    )
  }
}
