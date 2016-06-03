import { routes } from 'utils'

import New from './new'
import Overview from './overview'
import Schedule from './schedule'

const Jobs = routes('overview', {
  new: New,
  overview: Overview,
  schedule: Schedule
})(
  ({ children }) => children
)

export default Jobs
