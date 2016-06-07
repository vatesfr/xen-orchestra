import Schedules from '../../schedule'
import React, { Component } from 'react'

export default class Edit extends Component {
  render () {
    const { id } = this.props.routeParams
    return <Schedules id={id} />
  }
}
