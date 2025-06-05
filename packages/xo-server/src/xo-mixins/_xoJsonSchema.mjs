import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, useDefaults: true })

function makeIsType({ type }) {
  if (typeof type === 'string') {
    return t => t === type
  }

  const types = new Set(type)
  return t => types.has(t)
}

/**
 * Transform an XO JSON schema to a standard JSON schema
 *
 * Differences of XO JSON schemas:
 * - objects:
 *   - properties are required by default
 *   - properties can be marked as `optional` in place of listing them with `required`
 *   - additional properties disabled by default
 *   - a wildcard `*` property can be used in place of `additionalProperties`
 * - strings must be non empty by default
 */
function xoToJsonSchema(schema) {
  if (schema.enum !== undefined) {
    return schema
  }

  const is = makeIsType(schema)

  if (is('array')) {
    const { items } = schema
    if (items !== undefined) {
      if (Array.isArray(items)) {
        for (let i = 0, n = items.length; i < n; ++i) {
          items[i] = xoToJsonSchema(items[i])
        }
      } else {
        schema.items = xoToJsonSchema(items)
      }
    }
  }

  if (is('object')) {
    const { properties = {} } = schema
    let keys = Object.keys(properties)

    for (const key of keys) {
      properties[key] = xoToJsonSchema(properties[key])
    }

    const { additionalProperties } = schema
    if (additionalProperties === undefined) {
      const wildCard = properties['*']
      if (wildCard === undefined) {
        // we want additional properties to be disabled by default unless no properties are defined
        schema.additionalProperties = keys.length === 0
      } else {
        delete properties['*']
        keys = Object.keys(properties)
        schema.additionalProperties = wildCard
      }
    } else if (typeof additionalProperties === 'object') {
      schema.additionalProperties = xoToJsonSchema(additionalProperties)
    }

    // we want properties to be required by default unless explicitly marked so
    // we use property `optional` instead of object `required`
    if (schema.required === undefined) {
      const required = keys.filter(key => {
        const value = properties[key]
        const required = !value.optional
        delete value.optional
        return required
      })
      if (required.length !== 0) {
        schema.required = required
      }
    }
  }

  if (is('string')) {
    // we want strings to be not empty by default
    if (schema.minLength === undefined && schema.format === undefined && schema.pattern === undefined) {
      schema.minLength = 1
    }
  }

  return schema
}

export function compileXoJsonSchema(schema) {
  return ajv.compile(xoToJsonSchema(schema))
}
