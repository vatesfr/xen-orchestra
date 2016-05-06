import React from 'react'
import Select from 'react-select'
import XoAbstractInput from './xo-abstract-input'
import _ from 'messages'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import { PrimitiveInputWrapper } from './helpers'
import { parse } from 'xo-remote-parser'
import { subscribe } from 'xo'

// ===================================================================

export default class RemoteInput extends XoAbstractInput {
  componentWillMount () {
    this.componentWillUnmount = subscribe('remotes', remotes => {
      this.setState({
        remotes: groupBy(map(remotes, parse), 'type')
      })
    })
  }

  render () {
    const {
      props,
      state
    } = this

    let options = []

    forEach(state.remotes, (remotes, type) => {
      options.push({
        label: type,
        disabled: true
      })

      options = options.concat(
        map(remotes, remote => ({
          value: remote.id,
          label: remote.name
        }))
      )
    })

    return (
      <PrimitiveInputWrapper {...props}>
        <Select
          multi={props.schema.type === 'array'}
          onChange={this._handleChange}
          options={options}
          placeholder={_('selectRemotes')}
          required={props.required}
          value={state.value}
        />
      </PrimitiveInputWrapper>
    )
  }
}
