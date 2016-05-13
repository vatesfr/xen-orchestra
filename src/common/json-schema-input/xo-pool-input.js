import React from 'react'
import { SelectPool } from 'select-objects'
import { connectStore } from 'utils'
import { pools } from 'selectors'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@connectStore({
  pools
}, { withRef: true })
export default class PoolInput extends XoAbstractInput {
  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectPool
          multi={props.schema.type === 'array'}
          onChange={props.onChange}
          options={props.pools}
          ref='input'
          required={props.required}
        />
      </PrimitiveInputWrapper>
    )
  }
}
