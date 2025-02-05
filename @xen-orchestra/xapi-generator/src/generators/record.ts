import { Command } from 'commander'
import { XapiItem } from '../types'
import { loadJson } from '../utils/load-json'
import { toClassName } from '../utils/to-class-name'
import { toType } from '../utils/to-type'

function sortProperties(p1: string, p2: string) {
  return p1.replace('/** @deprecated */', '').trim().localeCompare(p2.replace('/** @deprecated */', '').trim())
}

export const generateRecord = (item: XapiItem) => {
  const properties = item.fields.map(field => {
    const isPublished = field.lifecycle.state === 'Published_s'
    const isFromRio = field.lifecycle.transitions.some(t => t.release === 'rio' && t.transition === 'published')
    const isDeprecated = field.lifecycle.transitions.some(t => t.transition === 'deprecated')
    const isOptional = field.default === undefined || field.default === 'Null' || field.default === 'OpaqueRef:NULL'

    function isAlwaysExisting() {
      if (field.name === 'uuid') {
        return true
      }

      if (!isPublished || !isFromRio || isDeprecated) {
        return false
      }

      if (field.type.endsWith(' set')) {
        return true
      }

      return !isOptional
    }

    // const isAlwaysExisting =
    //   field.name === 'uuid' || field.type.endsWith(' set') || (isPublished && isFromRio && !isDeprecated && !isOptional)

    const result = [`  ${field.name}${isAlwaysExisting() ? '' : '?'}: ${toType(field.type)}`]

    if (isDeprecated) {
      result.unshift('  /** @deprecated */')
    }

    return result.join('\n')
  })

  properties.unshift(`  $ref: Branded<'${item.name}'>`)
  properties.unshift(`  $type: '${item.name}'`)

  return `export interface ${toClassName(item.name)} {\n${properties.sort(sortProperties).join('\n')}\n}`
}

const recordCommand = new Command('record')
  .argument('<type>', 'Type of the record (vm, host, ...)')
  .description('Generate a record type')
  .option('-j, --json <path>', 'Path to the JSON file')
  .action(async (type, { json }) => {
    const items = await loadJson(json)
    const item = items.find(item => item.name.toLowerCase() === type.toLowerCase())

    if (item === undefined) {
      console.error(`Type ${type} not found`)
      process.exit(1)
    }

    console.log(generateRecord(item))
  })

export { recordCommand }
