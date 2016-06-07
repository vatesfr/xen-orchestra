import { routes } from 'utils'

import Edit from './edit'
import New from './new'
import Overview from './overview'
import Schedule from './schedule'
import ScheduleEdit from './schedule/edit'

const Jobs = routes('overview', {
  ':id/edit': Edit,
  new: New,
  overview: Overview,
  schedule: Schedule,
  'schedule/:id/edit': ScheduleEdit
})(
  ({ children }) => children
)

export default Jobs
