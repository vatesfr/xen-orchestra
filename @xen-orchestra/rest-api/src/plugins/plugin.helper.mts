import { invalidParameters } from 'xo-common/api-errors.js'
import { OBFUSCATED_VALUE } from '@vates/obfuscate'
import type { XoPlugin } from '@vates/types'

// xo-server only obfuscates the properties named like a password or a token
const SECRETS_BY_PLUGIN: { [P in XoPlugin as P['name']]?: (keyof NonNullable<P['configuration']>)[] } = {
  'auth-github': ['clientSecret'],
  'auth-google': ['clientSecret'],
  'auth-oidc': ['clientSecret'],
  openmetrics: ['secret'],
  'transport-nagios': ['key'],
  'transport-slack': ['webhookUri'],
}

type JsonSchema = {
  additionalProperties?: unknown
  anyOf?: JsonSchema[]
  items?: JsonSchema
  oneOf?: JsonSchema[]
  properties?: Record<string, JsonSchema>
  [keyword: string]: unknown
}

type UnknownPropertyError = {
  instancePath: string
  keyword: 'additionalProperties'
  message: string
  params: { additionalProperty: string }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const escapePointer = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1')

function collectUnknownProperties(value: unknown, schema: JsonSchema, path: string, errors: UnknownPropertyError[]) {
  if (Array.isArray(value)) {
    const { items } = schema
    if (items !== undefined) {
      value.forEach((item, i) => collectUnknownProperties(item, items, `${path}/${i}`, errors))
    }
    return
  }

  const { properties } = schema
  if (!isObject(value) || properties === undefined || schema.additionalProperties === true) {
    return
  }

  const declared = new Set(Object.keys(properties))
  for (const subSchema of [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])]) {
    Object.keys(subSchema.properties ?? {}).forEach(key => declared.add(key))
  }

  for (const [key, propertyValue] of Object.entries(value)) {
    if (!declared.has(key)) {
      errors.push({
        instancePath: `${path}/${escapePointer(key)}`,
        keyword: 'additionalProperties',
        message: 'must NOT have additional properties',
        params: { additionalProperty: key },
      })
    } else if (properties[key] !== undefined) {
      collectUnknownProperties(propertyValue, properties[key], `${path}/${escapePointer(key)}`, errors)
    }
  }
}

export function assertNoUnknownProperties(value: unknown, schema: JsonSchema | undefined): void {
  if (schema === undefined) {
    return
  }

  const errors: UnknownPropertyError[] = []
  collectUnknownProperties(value, schema, '', errors)
  if (errors.length !== 0) {
    throw invalidParameters(errors)
  }
}

export function obfuscatePluginSecrets<T extends XoPlugin>(plugin: T): T {
  const secrets: string[] | undefined = SECRETS_BY_PLUGIN[plugin.name]
  if (secrets === undefined || plugin.configuration === undefined) {
    return plugin
  }

  const configuration: Record<string, unknown> = { ...plugin.configuration }
  for (const key of secrets) {
    if (typeof configuration[key] === 'string') {
      configuration[key] = OBFUSCATED_VALUE
    }
  }
  return { ...plugin, configuration }
}
