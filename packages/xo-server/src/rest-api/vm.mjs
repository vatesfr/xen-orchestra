import AbstractXapiCollection from './AbstractXapiCollection.mjs'

class Vm extends AbstractXapiCollection {
  constructor(app) {
    super(app, 'VM')
  }

  registerRoutes() {
    super.registerRoutes()
    this.getRouter().get('/:uuid/name_label', (req, res) => {
      return res.json(res.locals.object.name_label)
    })
  }
}

export default Vm
