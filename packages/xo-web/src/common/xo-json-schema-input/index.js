import forEach from 'lodash/forEach'

import XoHighLevelObjectInput from './xo-highlevel-object-input'
import XoHostInput from './xo-host-input'
import XoPoolInput from './xo-pool-input'
import XoRemoteInput from './xo-remote-input'
import XoRoleInput from './xo-role-input'
import xoSnapshotInput from './xo-snapshot-input'
import XoSrInput from './xo-sr-input'
import XoSubjectInput from './xo-subject-input'
import XoTagInput from './xo-tag-input'
import XoVdiInput from './xo-vdi-input'
import XoVmInput from './xo-vm-input'
import { getType, getXoType } from '../json-schema-input/helpers'

// ===================================================================

const XO_TYPE_TO_COMPONENT = {
  host: XoHostInput,
  pool: XoPoolInput,
  remote: XoRemoteInput,
  role: XoRoleInput,
  snapshot: xoSnapshotInput,
  sr: XoSrInput,
  subject: XoSubjectInput,
  tag: XoTagInput,
  vdi: XoVdiInput,
  vm: XoVmInput,
  xoobject: XoHighLevelObjectInput,
}

// ===================================================================

const buildStringInput = (uiSchema, key, xoType) => {
  if (key === 'password') {
    uiSchema.config = { password: true }
  }

  uiSchema.widget = XO_TYPE_TO_COMPONENT[xoType]
}

// ===================================================================

const _generateUiSchema = (schema, uiSchema, key) => {
  const type = getType(schema)

  if (type === 'object') {
    const properties = (uiSchema.properties = {})

    forEach(schema.properties, (schema, key) => {
      const subUiSchema = (properties[key] = {})
      _generateUiSchema(schema, subUiSchema, key)
    })
  } else if (type === 'array') {
    const widget = XO_TYPE_TO_COMPONENT[getXoType(schema.items)]

    if (widget) {
      uiSchema.widget = widget
      uiSchema.config = { multi: true }
    } else {
      const subUiSchema = (uiSchema.items = {})
      _generateUiSchema(schema.items, subUiSchema, key)
    }
  } else if (type === 'string') {
    buildStringInput(uiSchema, key, getXoType(schema))
  }
}

export const generateUiSchema = schema => {
  const uiSchema = {}
  _generateUiSchema(schema, uiSchema, '')
  return uiSchema
}
