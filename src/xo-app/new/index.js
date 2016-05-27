import { routes } from 'utils'

import Vm from './vm'
import Sr from './sr'

const New = routes('vm', {
  sr: Sr,
  vm: Vm
})(
  ({ children }) => children
)

export default New
