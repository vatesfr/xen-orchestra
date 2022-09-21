import PropTypes from 'prop-types'
import React from 'react'
import uncontrollableInput from 'uncontrollable-input'

import Combobox from '../combobox'
import Component from '../base-component'
import getEventValue from '../get-event-value'

import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@uncontrollableInput()
export default class StringInput extends Component {
  static propTypes = {
    password: PropTypes.bool,
  }

  // the value of this input  is undefined not '' when empty to make
  // it homogenous with when the user has never touched this input
  _onChange = event => {
    const value = getEventValue(event)
    this.props.onChange(value !== '' ? value : undefined)
  }

  render() {
    const { required, schema } = this.props
    const { disabled, password, placeholder = schema.default, value, ...props } = this.props
    delete props.onChange

    return (
      <PrimitiveInputWrapper {...props}>
        <Combobox
          value={value !== undefined ? value : ''}
          disabled={disabled}
          multiline={schema.$multiline}
          onChange={this._onChange}
          options={schema.defaults}
          placeholder={placeholder || schema.default}
          required={required}
          type={password && 'password'}
        />
      </PrimitiveInputWrapper>
    )
  }
}
