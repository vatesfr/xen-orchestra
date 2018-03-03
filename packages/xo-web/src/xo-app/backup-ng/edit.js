import addSubscriptions from 'add-subscriptions'
import React from 'react'
import { injectState, provideState } from '@julien-f/freactal'
import { Debug } from 'utils'
import { subscribeBackupNgJobs, subscribeSchedules } from 'xo'

import New from './new'

export default [
  addSubscriptions({
    jobs: subscribeBackupNgJobs,
    schedules: subscribeSchedules,
  }),
  provideState({
    computed: {
      value: ({ jobs, schedules }) => {},
    },
  }),
  injectState,
  props => ({ state }) => <New value={state.value} />,
].reduceRight((value, decorator) => decorator(value))
