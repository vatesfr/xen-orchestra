import Collection from '../collection/redis'
import Model from '../model'

// ===================================================================

export default class Server extends Model {}

// -------------------------------------------------------------------

export class Servers extends Collection {
  get Model () {
    return Server
  }

  async create ({host, username, password, readOnly}) {
    if (await this.exists({host})) {
      throw new Error('server already exists')
    }

    return /* await */ this.add({host, username, password, readOnly})
  }
}
