import using from 'promise-toolbox/using'

import { getRemoteHandler } from './backups/_RemoteAdapter'

export default class Remotes {
  constructor(app, { config }) {
    app.api.addMethods({
      remote: {
        getInfo: [
          ({ remote }) =>
            using(
              getRemoteHandler(remote, config, config.remoteOptions),
              handler => handler.getInfo()
            ),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],

        test: [
          ({ remote }) =>
            using(
              getRemoteHandler(remote, config, config.remoteOptions),
              handler => handler.test()
            ),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],
      },
    })
  }
}
