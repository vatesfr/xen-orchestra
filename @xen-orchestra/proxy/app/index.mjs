import Config from '@xen-orchestra/mixins/Config.mjs'
import Hooks from '@xen-orchestra/mixins/Hooks.mjs'
import HttpProxy from '@xen-orchestra/mixins/HttpProxy.mjs'
import SslCertificate from '@xen-orchestra/mixins/SslCertificate.mjs'
import mixin from '@xen-orchestra/mixin'
import { createDebounceResource } from '@vates/disposable/debounceResource.js'

import Api from './mixins/api.mjs'
import Appliance from './mixins/appliance.mjs'
import Authentication from './mixins/authentication.mjs'
import Backups from './mixins/backups.mjs'
import Logs from './mixins/logs.mjs'
import Remotes from './mixins/remotes.mjs'
import ReverseProxy from './mixins/reverseProxy.mjs'

export default class App {
  constructor(opts) {
    mixin(
      this,
      {
        Api,
        Appliance,
        Authentication,
        Backups,
        Config,
        Hooks,
        HttpProxy,
        Logs,
        Remotes,
        ReverseProxy,
        SslCertificate,
      },
      [opts]
    )

    const debounceResource = createDebounceResource()
    this.config.watchDuration('resourceCacheDelay', delay => {
      debounceResource.defaultDelay = delay
    })
    this.hooks.once('stop', debounceResource.flushAll)

    this.debounceResource = debounceResource
  }
}
