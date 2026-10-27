import {
  getFieldType,
  type GetItemLabel,
  getPropertyLabel,
  getSchemaType,
  isMissingValue,
  isObject,
  isObjectSchemaWithProperties,
  isRequiredProperty,
  type JsonSchema,
} from '@/modules/plugin/utils/json-schema.util.ts'

export type JsonSchemaPath = string[]

export type JsonSchemaFieldError =
  | { rule: 'required' }
  | { rule: 'integer' }
  | { rule: 'minimum'; limit: number }
  | { rule: 'maximum'; limit: number }
  | { rule: 'min-items'; limit: number }

type JsonSchemaInvalidField = {
  path: JsonSchemaPath
  labels: string[]
  error: JsonSchemaFieldError
}

type Location = {
  path: JsonSchemaPath
  labels: string[]
  getItemLabel: GetItemLabel
}

function getValueError(schema: JsonSchema, value: unknown): JsonSchemaFieldError | undefined {
  if (Array.isArray(value)) {
    const { minItems } = schema

    return minItems !== undefined && value.length < minItems ? { rule: 'min-items', limit: minItems } : undefined
  }

  if (typeof value !== 'number') {
    return undefined
  }

  const isNotInteger = getSchemaType(schema) === 'integer' && !Number.isInteger(value)

  if (isNotInteger) {
    return { rule: 'integer' }
  }

  if (schema.minimum !== undefined && value < schema.minimum) {
    return { rule: 'minimum', limit: schema.minimum }
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    return { rule: 'maximum', limit: schema.maximum }
  }

  return undefined
}

// the server rejects any other constraint (e.g. `oneOf`), which the form does not display
function getInvalidValue(schema: JsonSchema, value: unknown, location: Location): JsonSchemaInvalidField[] {
  const error = getValueError(schema, value)
  const invalidValue = error === undefined ? [] : [{ path: location.path, labels: location.labels, error }]
  const isList = getFieldType(schema) === 'array' && Array.isArray(value)

  return isList ? [...invalidValue, ...getInvalidItems(schema, value, location)] : invalidValue
}

function getInvalidItems(schema: JsonSchema, items: unknown[], location: Location): JsonSchemaInvalidField[] {
  const itemSchema = schema.items ?? {}

  return items.flatMap((item, index) => {
    const itemLocation = {
      ...location,
      path: [...location.path, String(index)],
      labels: [...location.labels, location.getItemLabel(index, itemSchema)],
    }

    if (getSchemaType(itemSchema) === 'object') {
      return getInvalidProperties(itemSchema, item, itemLocation)
    }

    // an empty item would be sent as `null`, it must be filled or removed
    if (isMissingValue(item)) {
      return [{ path: itemLocation.path, labels: itemLocation.labels, error: { rule: 'required' } }]
    }

    return getInvalidValue(itemSchema, item, itemLocation)
  })
}

function getInvalidProperties(schema: JsonSchema, value: unknown, location: Location): JsonSchemaInvalidField[] {
  if (!isObjectSchemaWithProperties(schema)) {
    return []
  }

  const object = isObject(value) ? value : {}

  return Object.entries(schema.properties).flatMap(([key, propertySchema]) => {
    const propertyValue = object[key]
    const propertyLocation = {
      ...location,
      path: [...location.path, key],
      labels: [...location.labels, getPropertyLabel(key, propertySchema)],
    }
    const isRequired = isRequiredProperty(schema, key)
    const fieldType = getFieldType(propertySchema)

    // a required object is always displayed, so its own fields are reported instead of the object, and an optional one
    // is only checked once used
    const isDisplayedObject = fieldType === 'object' && (isRequired || isObject(propertyValue))
    // a boolean is never missing, as it is displayed unchecked
    const isMissingRequiredValue = isRequired && fieldType !== 'boolean' && isMissingValue(propertyValue)

    if (isDisplayedObject) {
      return getInvalidProperties(propertySchema, propertyValue, propertyLocation)
    }

    if (isMissingRequiredValue) {
      return [{ path: propertyLocation.path, labels: propertyLocation.labels, error: { rule: 'required' } }]
    }

    return getInvalidValue(propertySchema, propertyValue, propertyLocation)
  })
}

export function getInvalidFields(
  schema: JsonSchema,
  value: unknown,
  { getItemLabel }: Pick<Location, 'getItemLabel'>
): JsonSchemaInvalidField[] {
  return getInvalidProperties(schema, value, { path: [], labels: [], getItemLabel })
}

export function toPathKey(path: JsonSchemaPath): string {
  return path.join('.')
}

export function isPathWithin(path: JsonSchemaPath, parentPath: JsonSchemaPath): boolean {
  return parentPath.every((key, index) => path[index] === key)
}
