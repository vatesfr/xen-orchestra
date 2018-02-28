import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { getJob, getSchedule } from 'xo'

import New from '../new'

export default class Edit extends Component {
  componentWillMount () {
    const { id } = this.props.routeParams

    if (id == null) {
      return
    }

    getSchedule(id).then(schedule => {
      getJob(schedule.jobId).then(job => {
        this.setState({ job, schedule })
      })
    })
  }

  render () {
    const { job, schedule } = this.state

    if (!job || !schedule) {
      return <h1>{_('statusLoading')}</h1>
    }

    return <New job={job} schedule={schedule} />
  }
}
