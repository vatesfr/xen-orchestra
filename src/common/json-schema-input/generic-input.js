import React, { Component } from 'react'
import includes from 'lodash/includes'

import {
  EMPTY_OBJECT,
  propTypes
} from 'utils'

// TODO: XoEntity, XoRole, XoObject?
import ArrayInput from './array-input'
import BooleanInput from './boolean-input'
import EnumInput from './enum-input'
import IntegerInput from './integer-input'
import NumberInput from './number-input'
import ObjectInput from './object-input'
import StringInput from './string-input'
import XoHostInput from './xo-host-input'
import XoPoolInput from './xo-pool-input'
import XoRemoteInput from './xo-remote-input'
import XoSrInput from './xo-sr-input'
import XoVmInput from './xo-vm-input'

// ===================================================================

const getType = (schema, attr = 'type') => {
  if (!schema) {
    return
  }

  const type = schema[attr]

  if (Array.isArray(type)) {
    if (includes(type, 'integer')) {
      return 'integer'
    }
    if (includes(type, 'number')) {
      return 'number'
    }

    return 'string'
  }

  return type
}

const getXoType = schema => getType(schema, 'xo:type')

const InputByType = {
  array: ArrayInput,
  boolean: BooleanInput,
  host: XoHostInput,
  integer: IntegerInput,
  number: NumberInput,
  object: ObjectInput,
  pool: XoPoolInput,
  remote: XoRemoteInput,
  sr: XoSrInput,
  string: StringInput,
  vm: XoVmInput
}

// ===================================================================

@propTypes({
  depth: propTypes.number,
  label: propTypes.any.isRequired,
  onChange: propTypes.func,
  required: propTypes.bool,
  schema: propTypes.object.isRequired,
  uiSchema: propTypes.object,
  value: propTypes.any
})
export default class GenericInput extends Component {
  get value () {
    const { input } = this.refs
    return input.getWrappedInstance
      ? input.getWrappedInstance().value
      : input.value
  }

  set value (value) {
    const { input } = this.refs

    if (input.getWrappedInstance) {
      input.getWrappedInstance().value = value
    } else {
      input.value = value
    }
  }

  render () {
    const {
      schema,
      uiSchema = EMPTY_OBJECT,
      ...opts
    } = this.props

    const props = {
      ...opts,
      schema,
      uiSchema,
      ref: 'input'
    }

    // Enum, special case.
    if (schema.enum) {
      return <EnumInput {...props} />
    }

    const type = getXoType(schema) || getType(schema)
    const Input = uiSchema.widget || InputByType[type]

    if (!Input) {
      throw new Error(`Unsupported type: ${type}.`)
    }

    return <Input {...props} />
  }
}
