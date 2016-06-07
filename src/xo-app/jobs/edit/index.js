import Jobs from '../new'
import React, { Component } from 'react'

export default class Edit extends Component {
  render () {
    const { id } = this.props.routeParams
    return <Jobs id={id} />
  }
}
