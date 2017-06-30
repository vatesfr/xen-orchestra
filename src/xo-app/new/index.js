import { routes } from 'utils'

import Sr from './sr'
import VmGroup from './vm-group'

const New = routes('vm', {
  sr: Sr,
  'vm-group': VmGroup
})(
  ({ children }) => children
)

export default New
