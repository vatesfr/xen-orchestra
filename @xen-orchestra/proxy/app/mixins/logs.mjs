import transportConsole from '@xen-orchestra/log/transports/console'
import { configure } from '@xen-orchestra/log/configure'
import { dedupe } from '@xen-orchestra/log/dedupe'

export default class Logs {
  constructor(app) {
    const transport = transportConsole()
    app.config.watch('logs', ({ filter, level }) => {
      configure([
        {
          filter: [process.env.DEBUG, filter],
          level,
          transport: dedupe({ transport }),
        },
      ])
    })
  }
}
