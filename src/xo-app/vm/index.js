// import _ from 'messages'
import React, { Component } from 'react'
import { connectStore } from 'utils'

@connectStore({
  vm: (state, props) => state.objects[props.params.id]
})
export default class extends Component {
  render () {
    const { vm } = this.props

    return <h1>{vm ? vm.name_label : 'unkown'}</h1>
  }
}
