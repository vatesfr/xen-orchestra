export type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string'

/**
 * Subset of JSON schema used by xo-server plugins to describe their configuration
 */
export type JsonSchema = {
  type?: JsonSchemaType | JsonSchemaType[]
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  enumNames?: string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  minimum?: number
  maximum?: number
  format?: string
  /** XO object type (e.g. `VM`, `Host`, `Tag`), the value is the object ID */
  $type?: string
  'xo:type'?: string
  $multiline?: boolean
}

export type JsonSchemaFieldType =
  | 'array'
  | 'boolean'
  | 'enum'
  | 'integer'
  | 'number'
  | 'object'
  | 'string'
  | 'xo-object'

export type JsonSchemaSelectOption = {
  value: unknown
  label: string
}

const XO_OBJECT_TYPES = ['host', 'pool', 'sr', 'tag', 'vm'] as const

export type XoObjectType = (typeof XO_OBJECT_TYPES)[number]

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getPropertyLabel(key: string, schema: JsonSchema): string {
  return schema.title ?? key
}

export function getSchemaType(schema: JsonSchema | undefined): JsonSchemaType | undefined {
  const type = schema?.type

  if (Array.isArray(type)) {
    if (type.includes('integer')) {
      return 'integer'
    }

    if (type.includes('number')) {
      return 'number'
    }

    return 'string'
  }

  return type
}

export function getXoObjectType(schema: JsonSchema | undefined): XoObjectType | undefined {
  const type = (schema?.['xo:type'] ?? schema?.$type)?.toLowerCase()

  return XO_OBJECT_TYPES.find(xoType => xoType === type)
}

export function getXoObjectReference(schema: JsonSchema): { objectType: XoObjectType; multiple: boolean } | undefined {
  const type = getSchemaType(schema)
  const multiple = type === 'array'

  if (type !== 'string' && !multiple) {
    return undefined
  }

  const objectType = getXoObjectType(multiple ? schema.items : schema)

  return objectType === undefined ? undefined : { objectType, multiple }
}

export function getFieldType(schema: JsonSchema): JsonSchemaFieldType | undefined {
  if (schema.enum !== undefined) {
    return 'enum'
  }

  if (getXoObjectReference(schema) !== undefined) {
    return 'xo-object'
  }

  const type = getSchemaType(schema)

  switch (type) {
    case 'array':
    case 'boolean':
    case 'integer':
    case 'number':
    case 'object':
    case 'string':
      return type
    default:
      return undefined
  }
}

export function getSchemaDefaults(schema: JsonSchema | undefined): Record<string, unknown> | undefined {
  if (getSchemaType(schema) !== 'object' || schema?.properties === undefined) {
    return undefined
  }

  const result: Record<string, unknown> = {}
  let hasDefaults = false

  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    if (propertySchema.default !== undefined) {
      result[key] = propertySchema.default
      hasDefaults = true
    } else if (getSchemaType(propertySchema) === 'object') {
      const nested = getSchemaDefaults(propertySchema)

      if (nested !== undefined) {
        result[key] = nested
        hasDefaults = true
      }
    }
  }

  return hasDefaults ? result : undefined
}

export function isSecretProperty(name: string | undefined, schema: JsonSchema): boolean {
  return name === 'password' || schema.format === 'password'
}
