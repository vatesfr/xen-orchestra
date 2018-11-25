import EventEmitter from 'events'
import mixin from '@xen-orchestra/mixin'
import { camelCase } from 'lodash'

import mixins from './mixins'

@mixin([require('./_hooks').default])
export default class App extends EventEmitter {
  constructor(opts) {
    super()

    Object.keys(mixins).forEach(mixin => {
      Object.defineProperty(this, camelCase(mixin), {
        value: new mixins[mixin](this, opts),
      })
    })
  }
}
