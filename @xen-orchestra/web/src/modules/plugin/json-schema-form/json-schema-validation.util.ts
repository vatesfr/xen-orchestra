import {
  getFieldType,
  getPropertyLabel,
  getSchemaType,
  isObject,
  isRequiredProperty,
  type JsonSchema,
} from '@/modules/plugin/json-schema-form/json-schema.util.ts'

/** keys of the objects and indexes of the arrays from the root value to a field */
export type JsonSchemaPath = string[]

type JsonSchemaMissingField = {
  path: JsonSchemaPath
  labels: string[]
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

type Location = {
  path: JsonSchemaPath
  labels: string[]
  getItemLabel: (index: number, itemSchema: JsonSchema) => string
}

function getMissingItems(schema: JsonSchema, items: unknown[], location: Location): JsonSchemaMissingField[] {
  const itemSchema = schema.items ?? {}

  return items.flatMap((item, index) => {
    const itemPath = [...location.path, String(index)]
    const itemLabels = [...location.labels, location.getItemLabel(index, itemSchema)]

    if (getSchemaType(itemSchema) === 'object') {
      return getMissingProperties(itemSchema, item, { ...location, path: itemPath, labels: itemLabels })
    }

    // an empty item would be sent as `null`, it must be filled or removed
    return isMissing(item) ? [{ path: itemPath, labels: itemLabels }] : []
  })
}

function getMissingProperties(schema: JsonSchema, value: unknown, location: Location): JsonSchemaMissingField[] {
  if (getSchemaType(schema) !== 'object' || schema.properties === undefined) {
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
    if (fieldType === 'object' && (isRequired || isObject(propertyValue))) {
      return getMissingProperties(propertySchema, propertyValue, propertyLocation)
    }

    // a boolean is never missing, as it is displayed unchecked
    if (isRequired && fieldType !== 'boolean' && isMissing(propertyValue)) {
      return [{ path: propertyLocation.path, labels: propertyLocation.labels }]
    }

    if (fieldType === 'array' && Array.isArray(propertyValue)) {
      return getMissingItems(propertySchema, propertyValue, propertyLocation)
    }

    return []
  })
}

export function getMissingFields(
  schema: JsonSchema,
  value: unknown,
  { getItemLabel }: Pick<Location, 'getItemLabel'>
): JsonSchemaMissingField[] {
  return getMissingProperties(schema, value, { path: [], labels: [], getItemLabel })
}

export function toPathKey(path: JsonSchemaPath): string {
  return path.join('.')
}

export function isPathWithin(path: JsonSchemaPath, parentPath: JsonSchemaPath): boolean {
  return parentPath.every((key, index) => path[index] === key)
}
