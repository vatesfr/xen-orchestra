import { type JsonSchemaPath, toPathKey } from '@/modules/plugin/utils/json-schema-validation.util.ts'
import {
  getFieldType,
  type GetItemLabel,
  getPropertyLabel,
  getXoObjectReference,
  isMissingValue,
  isObject,
  isObjectSchemaWithProperties,
  isSecretProperty,
  type JsonSchema,
  type XoObjectType,
} from '@/modules/plugin/utils/json-schema.util.ts'

export type JsonSchemaValueDisplay =
  | { kind: 'text'; text: string | undefined }
  | { kind: 'list'; items: string[] }
  | { kind: 'secret' }
  | { kind: 'boolean'; enabled: boolean }
  | { kind: 'xo-object'; objectType: XoObjectType; ids: string[] }

export type JsonSchemaValueRow = JsonSchemaValueDisplay & {
  key: string
  label: string
}

export type JsonSchemaValueSection = {
  key: string
  labels: string[]
  rows: JsonSchemaValueRow[]
}

function isEmptyValue(value: unknown): boolean {
  return isMissingValue(value) || (Array.isArray(value) && value.length === 0)
}

function formatValue(schema: JsonSchema, value: unknown): string | undefined {
  if (isEmptyValue(value)) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value
      .map(item => formatValue(schema.items ?? {}, item))
      .filter(text => text !== undefined)
      .join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  const enumIndex = schema.enum?.indexOf(value) ?? -1

  return schema.enumNames?.[enumIndex] ?? String(value)
}

function getValueDisplay(name: string, schema: JsonSchema, value: unknown): JsonSchemaValueDisplay {
  if (isEmptyValue(value)) {
    return { kind: 'text', text: undefined }
  }

  if (isSecretProperty(name, schema, value)) {
    return { kind: 'secret' }
  }

  const fieldType = getFieldType(schema)

  if (fieldType === 'boolean' && typeof value === 'boolean') {
    return { kind: 'boolean', enabled: value }
  }

  const reference = getXoObjectReference(schema)

  if (reference !== undefined) {
    const ids = [value].flat().filter(id => typeof id === 'string')

    return { kind: 'xo-object', objectType: reference.objectType, ids }
  }

  if (Array.isArray(value)) {
    const items = value.map(item => formatValue(schema.items ?? {}, item)).filter(item => item !== undefined)

    return items.length > 0 ? { kind: 'list', items } : { kind: 'text', text: undefined }
  }

  return { kind: 'text', text: formatValue(schema, value) }
}

export function getJsonSchemaValueSections(
  schema: JsonSchema,
  value: unknown,
  { getItemLabel }: { getItemLabel: GetItemLabel }
): JsonSchemaValueSection[] {
  const sections: JsonSchemaValueSection[] = []

  function addSection(objectSchema: JsonSchema, objectValue: unknown, path: JsonSchemaPath, labels: string[]) {
    if (!isObjectSchemaWithProperties(objectSchema)) {
      return
    }

    const section: JsonSchemaValueSection = { key: toPathKey(path), labels, rows: [] }
    const object = isObject(objectValue) ? objectValue : {}

    sections.push(section)

    for (const [key, propertySchema] of Object.entries(objectSchema.properties)) {
      const propertyValue = object[key]
      const propertyPath = [...path, key]
      const label = getPropertyLabel(key, propertySchema)
      const itemSchema = propertySchema.items
      const hasObjectItems =
        isObjectSchemaWithProperties(itemSchema) && Array.isArray(propertyValue) && propertyValue.length > 0

      if (isObjectSchemaWithProperties(propertySchema)) {
        addSection(propertySchema, propertyValue, propertyPath, [...labels, label])
      } else if (hasObjectItems) {
        propertyValue.forEach((item, index) =>
          addSection(
            itemSchema,
            item,
            [...propertyPath, String(index)],
            [...labels, label, getItemLabel(index, itemSchema)]
          )
        )
      } else {
        section.rows.push({
          key: toPathKey(propertyPath),
          label,
          ...getValueDisplay(key, propertySchema, propertyValue),
        })
      }
    }
  }

  addSection(schema, value, [], [])

  return sections.filter(section => section.rows.length > 0)
}
