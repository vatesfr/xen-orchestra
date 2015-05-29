import Collection from '../collection/redis'
import Model from '../model'

// ===================================================================

export default class Server extends Model {}

// -------------------------------------------------------------------

export class Servers extends Collection {
  get Model () {
    return Server
  }
}
