import type { JsonSchemaPath } from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import { isSensitiveParam, OBFUSCATED_VALUE } from '@vates/obfuscate'

export type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string'

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
  minItems?: number
  minimum?: number
  maximum?: number
  format?: string
  $type?: string
  'xo:type'?: string
  $multiline?: boolean
}

export type GetItemLabel = (index: number, itemSchema: JsonSchema) => string

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
  const canReferenceXoObject = type === 'string' || multiple

  if (!canReferenceXoObject) {
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

// an object or an array is laid out as a section of fields
export function isSectionSchema(schema: JsonSchema): boolean {
  const fieldType = getFieldType(schema)

  return fieldType === 'object' || fieldType === 'array'
}

export function isRequiredProperty(schema: JsonSchema, key: string): boolean {
  return schema.required?.includes(key) ?? false
}

export function isObjectSchemaWithProperties(
  schema: JsonSchema | undefined
): schema is JsonSchema & { properties: Record<string, JsonSchema> } {
  return getSchemaType(schema) === 'object' && schema?.properties !== undefined
}

export type JsonSchemaPropertyField = {
  key: string
  schema: JsonSchema
  label: string
  path: JsonSchemaPath
  required: boolean
}

export type JsonSchemaPropertyGroup = {
  fields: JsonSchemaPropertyField[]
  isBooleans: boolean
}

// consecutive booleans are grouped, any other property stands alone
export function getPropertyGroups(schema: JsonSchema, path: JsonSchemaPath): JsonSchemaPropertyGroup[] {
  const groups: JsonSchemaPropertyGroup[] = []

  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    const field: JsonSchemaPropertyField = {
      key,
      schema: propertySchema,
      label: getPropertyLabel(key, propertySchema),
      path: [...path, key],
      required: isRequiredProperty(schema, key),
    }
    const isBoolean = getFieldType(propertySchema) === 'boolean'
    const lastGroup = groups.at(-1)

    if (isBoolean && lastGroup?.isBooleans) {
      lastGroup.fields.push(field)
    } else {
      groups.push({ fields: [field], isBooleans: isBoolean })
    }
  }

  return groups
}

export function getSchemaDefaults(schema: JsonSchema | undefined): Record<string, unknown> | undefined {
  if (!isObjectSchemaWithProperties(schema)) {
    return undefined
  }

  const result: Record<string, unknown> = {}
  let hasDefaults = false

  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    const isRequiredObject = isRequiredProperty(schema, key) && getSchemaType(propertySchema) === 'object'

    if (propertySchema.default !== undefined) {
      result[key] = propertySchema.default
      hasDefaults = true
    } else if (isRequiredObject) {
      const nested = getSchemaDefaults(propertySchema)

      if (nested !== undefined) {
        result[key] = nested
        hasDefaults = true
      }
    }
  }

  return hasDefaults ? result : undefined
}

export function isMissingValue(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

// the REST API also obfuscates secrets of some plugins (e.g. `clientSecret`), which are only known by their value
export function isSecretProperty(name: string | undefined, schema: JsonSchema, value?: unknown): boolean {
  if (schema.format === 'password' || value === OBFUSCATED_VALUE) {
    return true
  }

  return name !== undefined && isSensitiveParam(name)
}
