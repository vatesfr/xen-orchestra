const JSON_TYPES = {
  __proto__: null,

  array: true,
  boolean: true,
  null: true,
  number: true,
  object: true,
  string: true,
}

function addType(schema, type) {
  const previous = schema.type
  if (previous === undefined) {
    schema.type = type
  } else if (Array.isArray(previous)) {
    if (previous.indexOf(type) === -1) {
      previous.push(type)
    }
  } else if (previous !== type) {
    schema.type = [previous, type]
  }
}

function getType(value) {
  let type = typeof value
  if (type === 'object') {
    if (value === null) {
      type = 'null'
    } else if (Array.isArray(value)) {
      type = 'array'
    }
  }

  if (type in JSON_TYPES) {
    return type
  }
  throw new TypeError('unsupported type: ' + type)
}

// like Math.max but v1 can be undefined
const max = (v1, v2) => (v1 > v2 ? v1 : v2)

// like Math.min but v1 can be undefined
const min = (v1, v2) => (v1 < v2 ? v1 : v2)

function updateSchema_(path, value, schema = { __proto__: null }, getOption) {
  if (value === undefined) {
    schema.optional = true
  } else {
    const type = getType(value)
    addType(schema, type)

    if (type === 'array') {
      const items = schema.items ?? (schema.items = { __proto__: null })
      const pathLength = path.length
      if (Array.isArray(items)) {
        for (let i = 0, n = value.length; i < n; ++i) {
          path[pathLength] = i
          items[i] = updateSchema_(path, value[i], items[i], getOption)
        }
      } else {
        for (let i = 0, n = value.length; i < n; ++i) {
          path[pathLength] = i
          updateSchema_(path, value[i], items, getOption)
        }
      }
      path.length = pathLength
    } else if (type === 'number') {
      if (getOption('computeMinimum', path)) {
        schema.minimum = min(schema.minimum, value)
      }
      if (getOption('computeMaximum', path)) {
        schema.maximum = max(schema.maximum, value)
      }
    } else if (type === 'object') {
      const pathLength = path.length
      const { additionalProperties } = schema
      if (typeof additionalProperties === 'object') {
        for (const key of Object.keys(value)) {
          path[pathLength] = key
          updateSchema_(path, value[key], additionalProperties, getOption)
        }
      } else {
        const properties = schema.properties ?? (schema.properties = { __proto__: null })

        // handle missing properties
        for (const key of Object.keys(properties)) {
          if (!Object.hasOwn(value, key)) {
            properties[key].optional = true
          }
        }

        // handle existing properties
        for (const key of Object.keys(value)) {
          path[pathLength] = key
          properties[key] = updateSchema_(path, value[key], properties[key], getOption)
        }
      }
      path.length = pathLength
    }
  }

  return schema
}

export function updateSchema(value, schema, options) {
  const getOption = options == null ? Function.prototype : typeof options === 'object' ? opt => options[opt] : options
  return updateSchema_([], value, schema, getOption)
}
