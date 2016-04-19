import { routes } from 'utils'

import Vm from './vm'

const New = routes('vm', [
  { ...Vm.route, path: 'vm' }
])(
  ({ children }) => children
)

export default New
