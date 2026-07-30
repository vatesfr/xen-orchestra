'use strict'

// ===================================================================

const j = require('path').join
const resolvePath = require('path').resolve

const fg = require('fast-glob')
const { homedir } = require('os')

const pMap = require('./_pMap')

// ===================================================================

function ignoreAccessErrors(error) {
  if (error.code !== 'EACCES') {
    throw error
  }

  return []
}

// ===================================================================

// Default configuration entries.
module.exports = [
  // Default vendor configuration.
  {
    name: 'vendor',
    dir: opts => opts.appDir,
    list: (_, dir) => dir && fg(j(dir, 'config.*')),
  },

  // Configuration for the whole system.
  {
    name: 'system',
    dir: opts => j('/etc', opts.appName),
    list: (_, dir) => fg(j(dir, 'config.*')),
  },

  // Configuration for the current user.
  {
    name: 'global',
    dir: opts => {
      const configDir =
        process.platform === 'win32' ? process.env.APPDATA : process.env.XDG_CONFIG_HOME || j(homedir(), '.config')
      return configDir && j(configDir, opts.appName)
    },
    list: (_, dir) => dir && fg(j(dir, 'config.*')),
  },

  // Configuration of the current project (local to the file
  // hierarchy).
  {
    name: 'local',
    list(opts) {
      const { appName } = opts

      // Compute the list of paths from the current directory to the
      // root directory.
      const paths = []
      let dir, prev
      dir = process.cwd()
      while (dir !== prev) {
        paths.push(j(dir, '.' + appName + '.*'))
        prev = dir
        dir = resolvePath(dir, '..')
      }

      return pMap(paths.reverse(), path => fg(path).catch(ignoreAccessErrors)).then(results => results.flat())
    },
  },
]
