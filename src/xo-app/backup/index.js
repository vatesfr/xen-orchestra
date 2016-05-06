import { routes } from 'utils'

import New from './new'

const Backup = routes('backup', {
  new: New
})(
  ({ children }) => children
)

export default Backup
