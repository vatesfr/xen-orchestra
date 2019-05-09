import forOwn from 'lodash/forOwn'

class OfController {
  constructor({ xo }) {
    this._xo = xo
  }

  load() {
    // FIXME: we should monitor when xapis are added/removed
    forOwn(this.getAllXapis(), xapi => {
      const { objects } = xapi

      objects.on('add', objects => {
        forOwn(objects, object => {
          const { $type } = object
          if ($type === 'PIF') {
            // TODO
          } else if ($type === 'VIF') {
            // TODO
          }
        })
      })

      objects.on('update', objects => {
        // TODO
      })

      objects.on('remove', objects => {
        // TODO
      })

      objects.on('finish', () => {
        // always called after an update cycle
      })
    })
  }
}

export default opts => new OfController(opts)
