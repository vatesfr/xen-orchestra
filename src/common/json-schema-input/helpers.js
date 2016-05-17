import React from 'react'
import marked from 'marked'

import { Col, Row } from 'grid'

// ===================================================================

export const descriptionRender = description =>
  <span className='text-muted' dangerouslySetInnerHTML={{__html: marked(description || '')}} />

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
    <Col mediumSize={6}>
      {descriptionRender(schema.description)}
    </Col>
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
