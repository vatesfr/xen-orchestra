import AbstractXapiCollection from './AbstractXapiCollection.mjs'

class Host extends AbstractXapiCollection {
  constructor(app) {
    super(app, 'host')
  }
}

export default Host
