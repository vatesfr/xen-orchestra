import type { OpenAPIV3 } from 'openapi-types'
import type { FieldDefinition } from '../../router/types.mjs'

// Build OpenApi schema from our FieldDefinition
export function buildOpenApiSchema(def: Record<string, FieldDefinition>): OpenAPIV3.SchemaObject {
  const schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {},
  }

  const required: string[] = []

  for (const [key, field] of Object.entries(def)) {
    const property: OpenAPIV3.SchemaObject = {}

    if (field.type === 'enum') {
      property.type = 'string'
      property.enum = field.enum
    } else {
      property.type = field.type
    }

    if (field.example !== undefined) {
      property.example = field.example
    }

    schema.properties![key] = property

    if (!field.optional) {
      required.push(key)
    }
  }

  if (required.length) {
    schema.required = required
  }

  return schema
}
