import { Command } from 'commander'
import process from 'process'
import { allCommand } from './generators/all'
import { baseCommand } from './generators/base'
import { enumsCommand } from './generators/enums'
import { recordCommand } from './generators/record'
import { recordsCommand } from './generators/records'

const program = new Command('generate')

program.addCommand(allCommand)
program.addCommand(baseCommand)
program.addCommand(recordCommand)
program.addCommand(recordsCommand)
program.addCommand(enumsCommand)

program.parse(process.argv)
