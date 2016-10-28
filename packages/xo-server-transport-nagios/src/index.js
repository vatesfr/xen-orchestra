export const configurationSchema = {
  foo: {
    required: true,
    title: 'Foo',
    type: 'string'
  }
}

class XoServerNagios {
  constructor ({ xo }) {
    this._xo = xo
  }

  configure (configuration) {
    throw new Error('not implemented')
  }

  load () {
    throw new Error('not implemented')
  }

  unload () {
    throw new Error('not implemented')
  }
}

export default opts => new XoServerNagios(opts)
