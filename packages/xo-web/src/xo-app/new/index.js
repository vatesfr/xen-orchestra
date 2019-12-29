import { routes } from 'utils'

import Network from './network'
import Sr from './sr'

const New = routes('vm', {
  network: Network,
  sr: Sr,
})(({ children }) => children)

export default New
