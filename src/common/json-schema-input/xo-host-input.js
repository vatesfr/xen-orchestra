import React from 'react'
import { SelectHost } from 'select-objects'
import { connectStore } from 'utils'
import { hosts } from 'selectors'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@connectStore({
  hosts
}, { withRef: true })
export default class HostInput extends XoAbstractInput {
  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectHost
          multi={props.schema.type === 'array'}
          onChange={props.onChange}
          options={props.hosts}
          ref='input'
          required={props.required}
        />
      </PrimitiveInputWrapper>
    )
  }
}
