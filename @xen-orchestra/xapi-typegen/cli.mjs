import { readFileSync } from 'fs'

import { genTs } from './_genTs.mjs'
import { updateSchema } from './_updateSchema.mjs'

const upperCamelCase = s =>
  s
    .split(/[^a-zA-Z]+/)
    .map(s => s[0].toUpperCase() + s.slice(1).toLocaleLowerCase())
    .join('')

const objects = JSON.parse(readFileSync('./objects.json'))
for (const type of Object.keys(objects).sort()) {
  const schema = {
    __proto__: null,

    title: upperCamelCase(type),
    type: 'object',
    properties: {
      assigned_ips: {
        additionalProperties: {},
      },
      bios_strings: {
        additionalProperties: {},
      },
      features: {
        additionalProperties: {},
      },
      license_params: {
        additionalProperties: {},
      },
      networks: {
        additionalProperties: {},
      },
      other_config: {
        additionalProperties: {},
      },
      other: {
        additionalProperties: {},
      },
      restrictions: {
        additionalProperties: {},
      },
      sm_config: {
        additionalProperties: {},
      },
      xenstore_data: {
        additionalProperties: {},
      },
      VCPUs_utilisation: {
        additionalProperties: {},
      },
    },
  }
  for (const object of Object.values(objects[type])) {
    updateSchema(object, schema)
  }
  for (const name of Object.keys(schema.properties)) {
    if (schema.properties[name].type === undefined) {
      delete schema.properties[name]
    }
  }

  console.log(genTs(schema))
}
