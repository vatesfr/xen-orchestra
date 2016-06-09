import Scheduling from '../../scheduling'
import React, { Component } from 'react'

export default class Edit extends Component {
  render () {
    const { id } = this.props.routeParams
    return <Scheduling id={id} />
  }
}
