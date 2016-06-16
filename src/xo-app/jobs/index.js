import { routes } from 'utils'

import Edit from './edit'
import New from './new'
import Overview from './overview'
import Scheduling from './scheduling'
import SchedulingEdit from './scheduling/edit'

const Jobs = routes('overview', {
  ':id/edit': Edit,
  new: New,
  overview: Overview,
  scheduling: Scheduling,
  'scheduling/:id/edit': SchedulingEdit
})(
  ({ children }) => children
)

export default Jobs
