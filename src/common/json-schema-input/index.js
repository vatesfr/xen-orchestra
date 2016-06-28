import React from 'react'

import Component from '../base-component'
import GenericInput from './generic-input'
import generateUiSchema from './generate-ui-schema'

// ===================================================================

export default class GenericInputWrapper extends Component {
  get value () {
    return this.refs.input.value
  }

  set value (value) {
    this.refs.input.value = value
  }

  componentWillMount () {
    this.setState({
      uiSchema: generateUiSchema(this.props.schema)
    })
  }

  componentWillReceiveProps (nextProps) {
    const { schema, uiSchema } = nextProps
    const { props } = this

    // uiSchema given, ok.
    if (uiSchema) {
      return this.setState(uiSchema)
    }

    // schema was changed
    // or uiSchema was removed.
    if (
      schema !== props.schema ||
      props.uiSchema != null
    ) {
      this.setState({
        uiSchema: generateUiSchema(schema)
      })
    }
  }

  render () {
    return (
      <GenericInput
        {...this.props}
        ref='input'
        uiSchema={this.state.uiSchema}
      />
    )
  }
}
