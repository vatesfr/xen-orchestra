import PropTypes from 'prop-types'
import React, { Component } from 'react'

import getEventValue from '../get-event-value'
import uncontrollableInput from 'uncontrollable-input'
import { EMPTY_OBJECT } from '../utils'

import ArrayInput from './array-input'
import BooleanInput from './boolean-input'
import EnumInput from './enum-input'
import IntegerInput from './integer-input'
import NumberInput from './number-input'
import ObjectInput from './object-input'
import StringInput from './string-input'

import { getType } from './helpers'

// ===================================================================

const InputByType = {
  array: ArrayInput,
  boolean: BooleanInput,
  integer: IntegerInput,
  number: NumberInput,
  object: ObjectInput,
  string: StringInput,
}

// ===================================================================

@uncontrollableInput()
export default class GenericInput extends Component {
  static propTypes = {
    depth: PropTypes.number,
    disabled: PropTypes.bool,
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
  }

  _onChange = event => {
    const { name, onChange } = this.props
    onChange && onChange(getEventValue(event), name)
  }

  render() {
    const { schema, value, uiSchema = EMPTY_OBJECT, ...opts } = this.props

    const props = {
      ...opts,
      onChange: this._onChange,
      schema,
      uiSchema,
      value,
    }

    // Enum, special case.
    if (schema.enum) {
      return <EnumInput {...props} />
    }

    const type = getType(schema)
    const Input = uiSchema.widget || InputByType[type.toLowerCase()]

    if (!Input) {
      throw new Error(`Unsupported type: ${type}.`)
    }

    return <Input {...props} {...uiSchema.config} />
  }
}
