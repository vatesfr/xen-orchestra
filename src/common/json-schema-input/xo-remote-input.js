import React from 'react'
import { SelectRemote } from 'select-objects'
import { subscribeRemotes } from 'xo'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

export default class RemoteInput extends XoAbstractInput {
  constructor (props) {
    super(props)
    this.state = {
      remotes: []
    }
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeRemotes(remotes => {
      this.setState({
        remotes
      })
    })
  }

  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <SelectRemote
          multi={props.schema.type === 'array'}
          onChange={this._handleChange}
          options={this.state.remotes}
          ref='input'
          required={props.required}
        />
      </PrimitiveInputWrapper>
    )
  }
}
