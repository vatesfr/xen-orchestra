import { routes } from 'utils'

import Edit from './edit'
import Creation from './creation'
import Overview from './overview'
import Scheduling from './scheduling'
import SchedulingEdit from './scheduling/edit'

const Jobs = routes('overview', {
  ':id/edit': Edit,
  creation: Creation,
  overview: Overview,
  scheduling: Scheduling,
  'scheduling/:id/edit': SchedulingEdit
})(
  ({ children }) => children
)

export default Jobs
