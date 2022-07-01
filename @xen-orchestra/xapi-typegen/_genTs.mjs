let indentLevel = 0

function indent() {
  return '  '.repeat(indentLevel)
}

function quoteId(name) {
  return /^[a-z0-9_]+$/i.test(name) ? name : JSON.stringify(name)
}

function genType(type, schema) {
  if (type === 'array' && schema.items !== undefined) {
    const { items } = schema
    if (Array.isArray(items)) {
      if (items.length !== 0) {
        return ['[' + items.map(genTs).join(', ') + ']']
      }
    } else {
      const { type } = items
      if (type !== undefined && type.length !== 0) {
        return genTs(items, true) + '[]'
      } else {
        return 'unknown[]'
      }
    }
  }

  if (type !== 'object') {
    return type
  }

  const code = []

  const { title } = schema
  const isInterface = title !== undefined
  if (isInterface) {
    code.push('interface ', title, ' ')
  }
  const fieldDelimiter = (isInterface ? ';' : ',') + '\n'

  const { additionalProperties, properties } = schema
  const hasAdditionalProperties = additionalProperties?.type !== undefined
  const propertiesKeys = Object.keys(properties ?? {})

  if (!hasAdditionalProperties && propertiesKeys.length === 0) {
    code.push('{}')
    return code.join('')
  }

  code.push('{\n')
  ++indentLevel

  for (const name of propertiesKeys.sort()) {
    const schema = properties[name]
    code.push(indent(), quoteId(name))
    if (schema.optional) {
      code.push('?')
    }
    code.push(': ')

    code.push(genTs(schema))

    code.push(fieldDelimiter)
  }

  if (hasAdditionalProperties) {
    code.push(indent(), '[key: string]: ', genTs(additionalProperties), fieldDelimiter)
  }

  --indentLevel
  code.push(indent(), '}')

  return code.join('')
}

export function genTs(schema, groupMultiple = false) {
  let { type } = schema
  if (Array.isArray(type)) {
    if (type.length !== 1) {
      const code = type
        .sort()
        .map(type => genType(type, schema))
        .join(' | ')

      return groupMultiple ? '(' + code + ')' : code
    }
    type = type[0]
  }
  return genType(type, schema)
}
