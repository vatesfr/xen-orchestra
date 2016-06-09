import Creation from '../creation'
import React, { Component } from 'react'

export default class Edit extends Component {
  render () {
    const { id } = this.props.routeParams
    return <Creation id={id} />
  }
}
