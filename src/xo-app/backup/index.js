import { routes } from 'utils'

import New from './new'
import Overview from './overview'

const Backup = routes('backup', {
  new: New,
  overview: Overview
})(
  ({ children }) => children
)

export default Backup
