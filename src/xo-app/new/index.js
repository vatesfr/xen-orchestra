import { routes } from 'utils'

import Vm from './vm'

const New = routes('vm', {
  vm: Vm
})(
  ({ children }) => children
)

export default New
