import React from 'react'

import uncontrollableInput from 'uncontrollable-input'
import Component from '../base-component'
import { Toggle } from '../form'

import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@uncontrollableInput()
export default class BooleanInput extends Component {
  render() {
    const { disabled, onChange, value, ...props } = this.props

    return (
      <PrimitiveInputWrapper {...props}>
        <div className='checkbox form-control'>
          <Toggle disabled={disabled} onChange={onChange} value={value || false} />
        </div>
      </PrimitiveInputWrapper>
    )
  }
}
