import { EventEmitter } from 'events'

class XoaUpdater extends EventEmitter {
  constructor () {
    super()

    setInterval(() => {
      this.emit('toto')
    }, 5e3)
  }
}

export default new XoaUpdater()
