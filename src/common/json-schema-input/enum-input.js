import _ from 'messages'
import React from 'react'
import map from 'lodash/map'

import AbstractInput from './abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

export default class EnumInput extends AbstractInput {
  render () {
    const { props } = this
    const {
      onChange,
      required
    } = props

    return (
      <PrimitiveInputWrapper {...props}>
        <select
          className='form-control'
          defaultValue={props.value || _('noSelectedValue')}
          onChange={onChange && ((event) => onChange(event.target.value))}
          ref='input'
          required={required}
        >
          <option value=''>{_('noSelectedValue')}</option>
          {map(props.schema.enum, (value, index) =>
            <option value={value} key={index}>{value}</option>
          )}
        </select>
      </PrimitiveInputWrapper>
    )
  }
}
