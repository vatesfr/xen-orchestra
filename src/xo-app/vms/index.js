import { routes } from 'utils'

import Import from './import'

const Vms = routes('import', {
  import: Import
})(
  ({ children }) => children
)

export default Vms
