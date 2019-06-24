import { camelCase } from 'lodash'

import mixins from './mixins'

export default class App {
  constructor(opts) {
    Object.keys(mixins).forEach(mixin => {
      Object.defineProperty(this, camelCase(mixin), {
        value: new mixins[mixin](this, opts),
      })
    })
  }
}
