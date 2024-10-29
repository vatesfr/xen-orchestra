import AbstractEntity from './AbstractEntity.mjs'

class Dashboard extends AbstractEntity {
  constructor(app) {
    super(app, 'dashboard')
  }

  computeSomeRandomData() {
    return {
      nPool: Math.round(Math.random() * 100),
      nHosts: Math.round(Math.random() * 100),
    }
  }

  registerRoutes() {
    this.getRouter().get('/', (req, res) => this.sendObject(this.computeSomeRandomData(), req, res))
  }
}

export default Dashboard
