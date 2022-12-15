import { readFileSync } from 'fs'
import getopts from 'getopts'

const { version } = JSON.parse(readFileSync(new URL('package.json', import.meta.url)))

export function composeCommands(commands) {
  return async function (args, prefix) {
    const opts = getopts(args, {
      alias: {
        help: 'h',
      },
      boolean: ['help'],
      stopEarly: true,
    })

    const commandName = opts.help || args.length === 0 ? 'help' : args[0]
    const command = commands[commandName]
    if (command === undefined) {
      process.stdout.write(`Usage:

${Object.keys(commands)
  .filter(command => command !== 'help')
  .map(command => `    ${prefix} ${command} ${commands[command].usage || ''}`)
  .join('\n\n')}

xo-backups v${version}
`)
      process.exitCode = commandName === 'help' ? 0 : 1
      return
    }

    return (await command.default)(args.slice(1), prefix + ' ' + commandName)
  }
}
