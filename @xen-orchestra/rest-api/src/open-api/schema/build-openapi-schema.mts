import type { OpenAPIV3 } from 'openapi-types'
import type { FieldDefinition } from '../../router/types.mjs'

function buildOpenApiField(field: FieldDefinition): OpenAPIV3.SchemaObject {
  let property: OpenAPIV3.SchemaObject

  if (field.type === 'array') {
    property = { type: 'array', items: buildOpenApiField(field.items) }
  } else if (field.type === 'enum') {
    property = { type: 'string', enum: field.enum }
  } else if (field.type === 'object') {
    property = { type: 'object' }
    const nested = buildOpenApiSchema(field.fields)
    property.properties = nested.properties
    if (nested.required?.length) property.required = nested.required
  } else {
    property = { type: field.type }
  }

  if ('example' in field && field.example !== undefined) {
    property.example = field.example
  }

  return property
}

export function buildOpenApiSchema(def: Record<string, FieldDefinition> | FieldDefinition): OpenAPIV3.SchemaObject {
  // A single FieldDefinition (e.g. a top-level array response) has a string `type`,
  // whereas a fields map holds FieldDefinition objects as values.
  if (typeof (def as FieldDefinition).type === 'string') {
    return buildOpenApiField(def as FieldDefinition)
  }

  const schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {},
  }

  const required: string[] = []

  for (const [key, field] of Object.entries(def as Record<string, FieldDefinition>)) {
    schema.properties![key] = buildOpenApiField(field)

    if (!field.optional) {
      required.push(key)
    }
  }

  if (required.length) {
    schema.required = required
  }

  return schema
}
