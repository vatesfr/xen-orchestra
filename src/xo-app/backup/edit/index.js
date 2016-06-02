import React, { Component } from 'react'
import { getJob } from 'xo'

import New from '../new'

export default class Edit extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  componentWillMount () {
    const { id } = this.props.routeParams

    if (id == null) {
      return
    }

    getJob(id).then(job => {
      this.setState({ job })
    })
  }

  render () {
    const { job } = this.state

    if (!job) {
      return <h1>Loading…</h1>
    }

    return <New job={job} />
  }
}
