import AbstractCollection from './AbstractCollection.mjs'

class Host extends AbstractCollection {
  constructor(app) {
    super(app, 'host')
  }
}

export default Host
