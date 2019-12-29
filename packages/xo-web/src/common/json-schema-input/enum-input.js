import _ from 'intl'
import uncontrollableInput from 'uncontrollable-input'
import Component from 'base-component'
import React from 'react'
import { createSelector } from 'reselect'
import { findIndex, map } from 'lodash'

import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@uncontrollableInput()
export default class EnumInput extends Component {
  _getSelectedIndex = createSelector(
    () => this.props.schema.enum,
    () => {
      const { schema, value = schema.default } = this.props
      return value
    },
    (enumValues, value) => {
      const index = findIndex(enumValues, current => current === value)
      return index === -1 ? '' : index
    }
  )

  _onChange = event => {
    this.props.onChange(this.props.schema.enum[event.target.value])
  }

  render() {
    const {
      disabled,
      schema: { enum: enumValues, enumNames = enumValues },
      required,
    } = this.props

    return (
      <PrimitiveInputWrapper {...this.props}>
        <select
          className='form-control'
          disabled={disabled}
          onChange={this._onChange}
          required={required}
          value={this._getSelectedIndex()}
        >
          {_('noSelectedValue', message => (
            <option value=''>{message}</option>
          ))}
          {map(enumNames, (name, index) => (
            <option value={index} key={index}>
              {name}
            </option>
          ))}
        </select>
      </PrimitiveInputWrapper>
    )
  }
}
