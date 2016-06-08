import { routes } from 'utils'

import Import from './import'
import Vm from './vm'
import Sr from './sr'

const New = routes('vm', {
  import: Import,
  sr: Sr,
  vm: Vm
})(
  ({ children }) => children
)

export default New
