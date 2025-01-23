import AbstractCollection from './AbstractCollection.mjs'

class Vm extends AbstractCollection {
  constructor(app) {
    super(app, 'VM')
  }

  registerRoutes() {
    super.registerRoutes()
    this.getRouter()
      .get('/foo', (req, res) => {
        res.json('foo')
      })
      .get('/:uuid/name_label', (req, res) => {
        return res.json(res.locals.object.name_label)
      })
  }
}

export default Vm
