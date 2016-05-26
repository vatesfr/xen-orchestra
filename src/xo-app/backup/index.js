import { routes } from 'utils'

import New from './new'
import Overview from './overview'
import Restore from './restore'

const Backup = routes('backup', {
  new: New,
  overview: Overview,
  restore: Restore
})(
  ({ children }) => children
)

export default Backup
