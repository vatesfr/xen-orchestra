import transportConsole from '@xen-orchestra/log/transports/console.js'
import { configure } from '@xen-orchestra/log/configure.js'

export default class Logs {
  constructor(app) {
    const transport = transportConsole()
    app.config.watch('logs', ({ filter, level }) => {
      configure([
        {
          filter: [process.env.DEBUG, filter],
          level,
          transport,
        },
      ])
    })
  }
}
