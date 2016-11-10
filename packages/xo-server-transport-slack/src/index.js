export const configurationSchema = null

export const testSchema = null

class XoServerTransportNagios {
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

  test () {
    throw new Error('not implemented')
  }
}

export default opts => new XoServerTransportNagios(opts)
