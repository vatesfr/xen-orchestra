import { routes } from 'utils'

import Edit from './edit'
import New from './new'
import Overview from './overview'
import Restore from './restore'

const Backup = routes('overview', {
  ':id/edit': Edit,
  new: New,
  overview: Overview,
  restore: Restore
})(
  ({ children }) => children
)

export default Backup
