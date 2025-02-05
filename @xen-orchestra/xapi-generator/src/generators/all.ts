import { Command } from 'commander'
import { loadJson } from '../utils/load-json'
import { generateBase } from './base'
import { generateEnums } from './enums'
import { generateRecords } from './records'

const allCommand = new Command('all')
  .description('Generate all types and enums')
  .option('-j, --json <path>', 'Path to the JSON file')
  .action(async ({ json }) => {
    const items = await loadJson(json)

    console.log(generateBase())
    console.log(generateEnums(items))
    console.log(generateRecords(items))
  })

export { allCommand }
