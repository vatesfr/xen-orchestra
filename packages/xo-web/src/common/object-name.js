/** EXPERIMENT: this is here to avoid a littel code dupplication, but is not admitted as a highly recommendable component */
import { connectStore } from 'utils'
import { createGetObject } from 'selectors'
import React, { Component } from 'react'

@connectStore(() => {
  const object = createGetObject()
  return (state, props) => ({ object: object(state, props) })
})
export default class ObjectName extends Component {
  render() {
    const { object } = this.props
    return <span>{object && object.name_label}</span>
  }
}
