const getopts = require('getopts')

const { version } = require('./package.json')

module.exports = commands =>
  async function(args, prefix) {
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

    return command.main(args.slice(1), prefix + ' ' + commandName)
  }
