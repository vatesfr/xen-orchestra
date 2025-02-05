import { Command } from 'commander'
import { XapiEnum, XapiItem } from '../types'
import { loadJson } from '../utils/load-json'
import { toEnumProperty } from '../utils/to-enum-property'

export const generateEnum = (e: XapiEnum) => {
  const lines = new Set<string>()

  e.values.forEach(value => {
    lines.add(`  ${toEnumProperty(value.name)}: "${value.name}"`)
  })

  return [
    `export const ${toEnumProperty(e.name)} = {\n${Array.from(lines.values()).sort().join(',\n')}\n} as const`,
    '',
    `export type ${toEnumProperty(e.name)} = typeof ${toEnumProperty(e.name)}[keyof typeof ${toEnumProperty(e.name)}]`,
  ].join('\n')
}

export const generateEnums = (items: XapiItem[]) => {
  const enums = new Set<string>()

  items.forEach(item => {
    item.enums.forEach(enumItem => {
      enums.add(generateEnum(enumItem))
    })
  })

  return Array.from(enums.values()).join('\n\n')
}

const enumsCommand = new Command('enums')
  .description('Generate enums')
  .option('-j, --json <path>', 'Path to the JSON file')
  .action(async ({ json }) => {
    const items = await loadJson(json)

    console.log(generateEnums(items))
  })

export { enumsCommand }
