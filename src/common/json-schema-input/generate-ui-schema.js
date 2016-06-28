import forEach from 'lodash/forEach'

import { getType, getXoType } from './helpers'
import {
  XoHighLevelObjectInput,
  XoHostInput,
  XoPoolInput,
  XoRemoteInput,
  XoRoleInput,
  XoSrInput,
  XoSubjectInput,
  XoVmInput
} from '../xo-json-schema-input'

// ===================================================================

const XO_TYPE_TO_COMPONENT = {
  host: XoHostInput,
  xoobject: XoHighLevelObjectInput,
  pool: XoPoolInput,
  remote: XoRemoteInput,
  role: XoRoleInput,
  sr: XoSrInput,
  subject: XoSubjectInput,
  vm: XoVmInput
}

// ===================================================================

const buildStringInput = (uiSchema, key, xoType) => {
  if (key === 'password' || xoType === 'password') {
    uiSchema.config = { password: true }
  }

  uiSchema.widget = XO_TYPE_TO_COMPONENT[xoType]
}

// ===================================================================

const _generateUiSchema = (schema, uiSchema, key) => {
  const type = getType(schema)

  if (type === 'object') {
    const properties = uiSchema.properties = {}

    forEach(schema.properties, (schema, key) => {
      const subUiSchema = properties[key] = {}
      _generateUiSchema(schema, subUiSchema, key)
    })
  } else if (type === 'array') {
    const widget = XO_TYPE_TO_COMPONENT[getXoType(schema.items)]

    if (widget) {
      uiSchema.widget = widget
      uiSchema.config = { multi: true }
    } else {
      const subUiSchema = uiSchema.items = {}
      _generateUiSchema(schema.items, subUiSchema, key)
    }
  } else if (type === 'string') {
    buildStringInput(uiSchema, key, getXoType(schema))
  }
}

const generateUiSchema = schema => {
  const uiSchema = {}
  _generateUiSchema(schema, uiSchema, '')
  return uiSchema
}
export { generateUiSchema as default }
