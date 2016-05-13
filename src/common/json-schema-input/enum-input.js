import React from 'react'
import map from 'lodash/map'
import { injectIntl } from 'react-intl'
import { messages } from 'messages'

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
          defaultValue={props.value || ''}
          onChange={onChange && (event => onChange(event.target.value))}
          ref='input'
          required={required}
        >
          <option value=''>{props.intl.formatMessage(messages.noSelectedValue)}</option>
          {map(props.schema.enum, (value, index) =>
            <option value={value} key={index}>{value}</option>
          )}
        </select>
      </PrimitiveInputWrapper>
    )
  }
}
export default injectIntl(EnumInput, { withRef: true })
