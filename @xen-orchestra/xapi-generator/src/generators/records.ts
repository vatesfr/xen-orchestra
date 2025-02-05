import { Command } from 'commander'
import { toClassName } from '../utils/to-class-name'
import { XapiItem } from '../types'
import { loadJson } from '../utils/load-json'
import { generateRecord } from './record'

export const generateRecords = (items: XapiItem[]) => {
  const unionTypes: string[] = []

  const types = items
    .map(item => {
      unionTypes.push(toClassName(item.name))
      return generateRecord(item)
    })
    .join('\n\n')

  return `${types}\n\nexport type XenApiRecord = ${unionTypes.join(' | ')}`
}

const recordsCommand = new Command('records')
  .description('Generate all records type')
  .option('-j, --json <path>', 'Path to the JSON file')
  .action(async ({ json }) => {
    const items = await loadJson(json)

    console.log(generateRecords(items))
  })

export { recordsCommand }
