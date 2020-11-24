import React from 'react'
import includes from 'lodash/includes'
import marked from 'marked'

import { Col, Row } from 'grid'

// ===================================================================

export const getType = schema => {
  if (!schema) {
    return
  }

  const type = schema.type

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

export const getXoType = schema => {
  const type = schema && (schema['xo:type'] || schema.$type)

  if (type) {
    return type.toLowerCase()
  }
}

// ===================================================================

export const descriptionRender = description => (
  <span className='text-muted' dangerouslySetInnerHTML={{ __html: marked(description || '') }} />
)

// ===================================================================

export const PrimitiveInputWrapper = ({ label, required = false, schema, children }) => (
  <Row>
    <Col mediumSize={6}>
      <div className='input-group'>
        <span className='input-group-addon'>
          {label}
          {required && <span className='text-warning'>*</span>}
        </span>
        {children}
      </div>
    </Col>
    <Col mediumSize={6}>{descriptionRender(schema.description)}</Col>
  </Row>
)

// ===================================================================

export const forceDisplayOptionalAttr = ({ schema, value }) => {
  if (!schema || !value) {
    return false
  }

  // Array
  if (schema.items && Array.isArray(value)) {
    return true
  }

  // Object
  for (const key in schema.properties) {
    if (value[key]) {
      return true
    }
  }

  return false
}
