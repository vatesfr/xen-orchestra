import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import React from 'react'
import Component from 'base-component'
// import { injectState, provideState } from '@julien-f/freactal'
import { Debug } from 'utils'
import { subscribeBackupNgJobs, subscribeSchedules } from 'xo'
import { find, groupBy } from 'lodash'

import New from './new'

/*export default [
  addSubscriptions({
    jobs: subscribeBackupNgJobs,
    schedules: subscribeSchedules,
  }),
  provideState({
    computed: {
      value: ({ jobs, schedules }) => { console.log(jobs)},
    },
  }),
  injectState,
  props => ({ state }) => <New value={state.value} />,
].reduceRight((value, decorator) => decorator(value))*/

@addSubscriptions({
  jobs: subscribeBackupNgJobs,
  schedulesByJob: cb =>
    subscribeSchedules(schedules => {
      cb(groupBy(schedules, 'jobId'))
    })
})
export default class Edit extends Component {
  render () {
    const { routeParams: { id }, jobs, schedulesByJob } = this.props
    return <New job={find(jobs, { id })} schedules={schedulesByJob && schedulesByJob[id]} />
  }
}
