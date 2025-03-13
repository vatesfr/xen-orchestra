import { Command } from 'commander'
import { XapiItem } from '../types'
import { loadJson } from '../utils/load-json'
import { toClassName } from '../utils/to-class-name'
import { toType } from '../utils/to-type'

const VERSION_BY_CODE_NAME: Record<string, number> = {
  rio: 4.0,
  miami: 4.1,
  symc: 4.1,
  orlando: 5.0,
  'orlando-update-1': 5.1,
  george: 5.5,
  'midnight-ride': 5.6,
  cowley: 5.6,
  boston: 6.0,
  tampa: 6.1,
  clearwater: 6.2,
  'vgpu-tech-preview': 6.2,
  'vgpu-productisation': 6.2,
  'clearwater-felton': 6.2,
  creedence: 6.5,
  cream: 6.5,
  indigo: 6.5,
  dundee: 7.0,
}

function sortProperties(p1: string, p2: string) {
  return p1.replace('/** @deprecated */', '').trim().localeCompare(p2.replace('/** @deprecated */', '').trim())
}

export const generateRecord = (item: XapiItem) => {
  const properties = item.fields.map(field => {
    const isPublished = field.lifecycle.state === 'Published_s'
    const isPublishedAfterDundee =
      isPublished &&
      field.lifecycle.transitions.some(
        t => t.transition === 'published' && VERSION_BY_CODE_NAME[t.release] === undefined
      )
    const isDeprecated = field.lifecycle.transitions.some(t => t.transition === 'deprecated')

    function isAlwaysExisting() {
      if (!isPublished || isPublishedAfterDundee) {
        return false
      }

      return true
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

  const isInterfaceDeprecated = item.lifecycle.transitions.some(t => t.transition === 'deprecated')

  const interface_schema = [
    `export interface ${toClassName(item.name)} {\n${properties.sort(sortProperties).join('\n')}\n}`,
  ]
  if (isInterfaceDeprecated) {
    interface_schema.unshift('/** @deprecated */')
  }
  return interface_schema.join('\n')
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
